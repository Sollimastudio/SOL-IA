// Reproducible model proof using newly generated speech, not a person's voice or the requested YouTube video.
import { createMediaWorker } from '../server/media-worker.mjs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const run = promisify(execFile), directory = await mkdtemp(join(tmpdir(), 'jarvis-asr-proof-'));
const token = randomBytes(32).toString('hex');
const phrase = 'This is a synthetic recording. Take a slow breath before you answer. You can choose the time for your response.';
let worker;
try {
  await run('ffmpeg', ['-nostdin', '-v', 'error', '-f', 'lavfi', '-i', `flite=text='${phrase}':voice=slt`, '-ar', '16000', join(directory, 'speech.wav')]);
  await run('ffmpeg', ['-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '2', join(directory, 'silent.wav')]);
  worker = createMediaWorker({ referenceToken: token, voiceToken: token, workDir: join(directory, 'work'), python: process.env.JARVIS_MEDIA_PYTHON, modelDir: process.env.JARVIS_MEDIA_MODEL_DIR });
  await new Promise(resolve => worker.listen(0, '127.0.0.1', resolve));
  const recognize = async file => {
    const bytes = await readFile(file), sourceSha256 = createHash('sha256').update(bytes).digest('hex'), started = performance.now();
    const response = await fetch(`http://127.0.0.1:${worker.address().port}/transcribe`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ mediaBase64: bytes.toString('base64'), sha256: sourceSha256, transcriptionConsent: true, maxCharacters: 3000, allowPaid: false }) });
    return { httpStatus: response.status, seconds: Number(((performance.now() - started) / 1000).toFixed(3)), result: await response.json(), sourceSha256 };
  };
  const speech = await recognize(join(directory, 'speech.wav'));
  assert.equal(speech.httpStatus, 200); assert.equal(speech.result.sourceSha256, speech.sourceSha256);
  assert.match(speech.result.text.toLowerCase(), /synthetic recording/); assert.match(speech.result.text.toLowerCase(), /before you answer/);
  const silence = await recognize(join(directory, 'silent.wav'));
  assert.equal(silence.result.code, 'no_speech_detected');
  console.log(JSON.stringify({ at: new Date().toISOString(), input: 'new synthetic flite/slt speech, not Sol and not the requested video', expected: phrase, speech, silence,
    limits: ['Real CPU ASR through local authenticated HTTP; no remote bot or source retrieval in this proof.', 'English controlled input only; no acceptance of Portuguese real-world accuracy, images, long audio or Sol voice identity.'] }, null, 2));
} finally {
  if (worker) await new Promise(resolve => worker.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
