// Self-hosted CPU worker. The web build does not start this process or install a model.
import { createServer } from 'node:http';
import { timingSafeEqual, createHash } from 'node:crypto';
import { mkdtemp, writeFile, rm, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { publicFetch } from './reference-acquisition.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const MAX_BYTES = 12_000_000;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function authorized(supplied, expected) {
  const a = Buffer.from(supplied || ''), b = Buffer.from(`Bearer ${expected || ''}`);
  return typeof expected === 'string' && expected.length >= 32 && a.length === b.length && timingSafeEqual(a, b);
}
async function jsonBody(req) {
  let size = 0; const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16_100_000) throw Object.assign(new Error(), { code: 'request_size_limit' });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function recognizeLocal(source, { python, modelDir, maxCharacters, maxSeconds, signal }) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(python, ['-m', 'local_studio.transcription', '--source', source, '--model-dir', modelDir,
      '--max-characters', String(maxCharacters), '--max-seconds', String(maxSeconds)], {
      cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'],
      // Do not inherit bot tokens, cloud credentials or the worker's bearer secrets.
      env: { PATH: process.env.PATH, LANG: 'C.UTF-8', TMPDIR: dirname(source), PYTHONUNBUFFERED: '1', HF_HUB_OFFLINE: '1', OMP_NUM_THREADS: '2' }
    });
    let size = 0, failed = false; const chunks = [];
    const stop = () => { failed = true; child.kill('SIGKILL'); };
    const timer = setTimeout(stop, 35000);
    signal?.addEventListener('abort', stop, { once: true });
    if (signal?.aborted) stop();
    child.stdout.on('data', chunk => { size += chunk.length; if (size > 350000) stop(); else chunks.push(chunk); });
    child.on('error', () => { clearTimeout(timer); signal?.removeEventListener('abort', stop); reject(new Error('processor_start_failed')); });
    child.on('close', () => {
      clearTimeout(timer); signal?.removeEventListener('abort', stop);
      if (failed) return resolveResult({ status: 'blocked', code: 'processor_deadline' });
      try { resolveResult(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { resolveResult({ status: 'blocked', code: 'processor_result_invalid' }); }
    });
  });
}
export function createMediaWorker({ referenceToken, voiceToken, workDir, python, modelDir, readPublic = publicFetch, recognize = recognizeLocal }) {
  if (!workDir || !python || !modelDir || ![referenceToken, voiceToken].some(t => typeof t === 'string' && t.length >= 32)) throw new Error('media_worker_configuration_required');
  let active = false;
  return createServer({ requestTimeout: 20000, headersTimeout: 10000, maxHeaderSize: 8192 }, async (req, res) => {
    const send = (status, value) => { if (!res.destroyed) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); } };
    const reference = req.url === '/reference', voice = req.url === '/transcribe';
    if (req.method !== 'POST' || (!reference && !voice)) return send(404, { status: 'blocked', code: 'route_not_found' });
    if (!authorized(req.headers.authorization, reference ? referenceToken : voiceToken)) return send(403, { status: 'blocked', code: 'worker_origin' });
    if (active) return send(429, { status: 'blocked', code: 'worker_busy' });
    active = true; let directory;
    const abort = new AbortController(); res.on('close', () => { if (!res.writableEnded) abort.abort(); });
    try {
      if (!String(req.headers['content-type']).startsWith('application/json')) return send(415, { status: 'blocked', code: 'json_required' });
      const body = await jsonBody(req);
      if (body.allowPaid !== false) return send(400, { status: 'blocked', code: 'local_only_required' });
      const maxCharacters = body.maxCharacters ?? 45000, maxSeconds = body.maxSeconds ?? 180;
      if (!Number.isInteger(maxCharacters) || maxCharacters < 40 || maxCharacters > 45000 || !Number.isInteger(maxSeconds) || maxSeconds < 1 || maxSeconds > 180) return send(400, { status: 'blocked', code: 'invalid_limits' });
      let bytes;
      if (reference) {
        if (body.kind === 'channel') return send(422, { status: 'blocked', code: 'channel_sample_required' });
        const source = await readPublic(body.url, { signal: abort.signal, maxBytes: MAX_BYTES });
        if (source.status !== 200) return send(422, { status: 'blocked', code: `source_http_${source.status}` });
        if (!/^(audio\/|video\/|application\/octet-stream)/i.test(String(source.headers['content-type']))) return send(422, { status: 'blocked', code: 'direct_media_required' });
        bytes = source.bytes;
      } else {
        if (body.transcriptionConsent !== true || typeof body.mediaBase64 !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.mediaBase64)) return send(400, { status: 'blocked', code: 'authorized_audio_required' });
        bytes = Buffer.from(body.mediaBase64, 'base64');
        if (bytes.toString('base64') !== body.mediaBase64 || digest(bytes) !== body.sha256) return send(400, { status: 'blocked', code: 'media_integrity_failed' });
      }
      if (!bytes.length || bytes.length > MAX_BYTES) return send(413, { status: 'blocked', code: 'media_size_limit' });
      await mkdir(workDir, { recursive: true, mode: 0o700 });
      // A bounded restart cleanup removes only this worker's abandoned temporary directories.
      for (const entry of await readdir(workDir, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name.startsWith('asr-') && (await stat(join(workDir, entry.name))).mtimeMs < Date.now() - 3600000) await rm(join(workDir, entry.name), { recursive: true });
      }
      directory = await mkdtemp(join(workDir, 'asr-'));
      const source = join(directory, 'source.media'); await writeFile(source, bytes, { mode: 0o600, flag: 'wx' });
      const result = await recognize(source, { python, modelDir, maxCharacters, maxSeconds, signal: abort.signal });
      if (result.status === 'ready' && result.sourceSha256 !== digest(bytes)) return send(502, { status: 'blocked', code: 'processor_integrity_failed' });
      await rm(directory, { recursive: true, force: true }); directory = undefined;
      send(result.status === 'ready' ? 200 : 422, result);
    } catch (error) {
      // No source URLs, tokens, file paths or audio in logs/responses.
      const safeCodes = new Set(['unsafe_url', 'unsafe_dns', 'source_too_large', 'request_size_limit']);
      send(422, { status: 'blocked', code: safeCodes.has(error.code) ? error.code : 'media_processing_failed' });
    } finally {
      if (directory) await rm(directory, { recursive: true, force: true }).catch(() => { console.error('media_cleanup_failed'); });
      active = false;
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const worker = createMediaWorker({ referenceToken: process.env.JARVIS_MEDIA_ADAPTER_TOKEN, voiceToken: process.env.LUCIDA_TRANSCRIPTION_TOKEN,
    workDir: process.env.JARVIS_MEDIA_WORK_DIR, python: process.env.JARVIS_MEDIA_PYTHON, modelDir: process.env.JARVIS_MEDIA_MODEL_DIR });
  worker.listen(Number(process.env.JARVIS_MEDIA_PORT || 8793), '127.0.0.1');
}
