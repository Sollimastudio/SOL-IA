import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sourceUrl = new URL('../src/components/JarvisLiveVoice.tsx', import.meta.url);

test('Live voice UI reports usage without promising that billing stopped', async () => {
  const source = await readFile(sourceUrl, 'utf8');

  assert.doesNotMatch(source, /ENCERRAR E PARAR COBRANÇA/);
  assert.match(source, /ENCERRAR CONVERSA/);
  assert.match(source, /Uso informado pela sessão/);
  assert.match(source, /valor final depende da confirmação e conciliação do provedor/i);
});
