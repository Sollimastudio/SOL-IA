import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { installPlatform } from '../src/core/installTarget.mjs';

test('installation instructions recognize iPhone, iPad desktop mode and Android without claiming support', () => {
  assert.equal(installPlatform({ userAgent: 'Mozilla iPhone Safari' }), 'ios');
  assert.equal(installPlatform({ userAgent: 'Mozilla iPad Safari' }), 'ios');
  assert.equal(installPlatform({ platform: 'MacIntel', maxTouchPoints: 5 }), 'ios');
  assert.equal(installPlatform({ platform: 'MacIntel', maxTouchPoints: 0 }), 'desktop');
  assert.equal(installPlatform({ userAgent: 'Mozilla Android Chrome' }), 'android');
  assert.equal(installPlatform(), 'desktop');
});

test('installed app starts at the same origin root without tokens or callback parameters', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  for (const key of ['id', 'start_url', 'scope']) assert.equal(manifest[key], '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.short_name, 'Jarvis');
  for (const size of [192, 512]) {
    assert.ok(manifest.icons.some(icon => icon.src === `/jarvis-icon-${size}.png` && icon.sizes === `${size}x${size}` && icon.type === 'image/png'));
  }
});

test('Apple and manifest icons exist with real PNG dimensions, not just declared metadata', async () => {
  for (const [name, size] of [['apple-touch-icon.png', 180], ['jarvis-icon-192.png', 192], ['jarvis-icon-512.png', 512]]) {
    const bytes = await readFile(new URL(`../public/${name}`, import.meta.url));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon.png"/);
});
