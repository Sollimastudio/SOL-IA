import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = resolve(root, process.env.JARVIS_RADAR_CONFIG || 'config/capability-radar-sources.json');
const statePath = resolve(root, process.env.JARVIS_RADAR_STATE || '.radar-cache/state.json');
const reportPath = resolve(root, process.env.JARVIS_RADAR_REPORT || 'radar-report.json');
const MAX_BYTES = 2_000_000;

function normalizeText(body) {
  return String(body)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_BYTES);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function safeJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
}

export async function inspectSource(source, previous = null, fetchImpl = globalThis.fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetchImpl(source.url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Jarvis-Capability-Radar/1.0 (+official-source-monitor)' }
    });
    const finalUrl = new URL(response.url || source.url);
    if (!source.allowedHosts.includes(finalUrl.hostname)) throw new Error('redirected_to_unapproved_host');
    if (!response.ok) return { key: source.key, kind: source.kind, url: source.url, ok: false, status: response.status, change: 'unavailable' };
    const body = await response.text();
    const normalized = normalizeText(body);
    if (!normalized) return { key: source.key, kind: source.kind, url: source.url, ok: false, status: response.status, change: 'empty' };
    const hash = sha256(normalized);
    const priorHash = typeof previous?.hash === 'string' ? previous.hash : null;
    return {
      key: source.key,
      kind: source.kind,
      url: source.url,
      finalUrl: finalUrl.toString(),
      ok: true,
      status: response.status,
      bytesRead: Buffer.byteLength(body),
      normalizedChars: normalized.length,
      hash,
      change: priorHash === null ? 'baseline_created' : priorHash === hash ? 'unchanged' : 'changed',
      previousHash: priorHash
    };
  } catch (error) {
    return { key: source.key, kind: source.kind, url: source.url, ok: false, status: null, change: 'unavailable', error: error?.name === 'AbortError' ? 'timeout' : String(error?.message || 'fetch_failed').slice(0, 160) };
  } finally {
    clearTimeout(timer);
  }
}

export async function runRadar({ fetchImpl = globalThis.fetch } = {}) {
  const config = await safeJson(configPath, null);
  if (!config || !Array.isArray(config.sources) || !config.sources.length) throw new Error('invalid_radar_config');
  const previous = await safeJson(statePath, { sources: {} });
  const results = [];
  for (const source of config.sources) {
    if (!source?.key || !source?.kind || !source?.url || !Array.isArray(source.allowedHosts)) throw new Error('invalid_radar_source');
    results.push(await inspectSource(source, previous.sources?.[source.key] || null, fetchImpl));
  }
  const observedAt = new Date().toISOString();
  const changed = results.filter(item => item.change === 'changed');
  const unavailable = results.filter(item => !item.ok);
  const report = {
    schema: 'jarvis-capability-radar-v1',
    configVersion: config.version,
    observedAt,
    changedCount: changed.length,
    unavailableCount: unavailable.length,
    requiresReview: changed.length > 0 || unavailable.length > 0,
    results
  };
  const nextState = {
    schema: 'jarvis-capability-radar-state-v1',
    updatedAt: observedAt,
    sources: Object.fromEntries(results.filter(item => item.ok && item.hash).map(item => [item.key, { hash: item.hash, observedAt, url: item.url, kind: item.kind }]))
  };
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await runRadar();
  console.log(JSON.stringify({ observedAt: report.observedAt, changedCount: report.changedCount, unavailableCount: report.unavailableCount, requiresReview: report.requiresReview }));
}
