import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = resolve(root, process.env.JARVIS_RADAR_CONFIG || 'config/capability-radar-sources.json');
const statePath = resolve(root, process.env.JARVIS_RADAR_STATE || '.radar-cache/state.json');
const reportPath = resolve(root, process.env.JARVIS_RADAR_REPORT || 'radar-report.json');
const MAX_BYTES = 2_000_000;
const MATERIAL_WINDOW = 220;
const MAX_MATERIAL_WINDOWS = 160;

export const DEFAULT_MATERIAL_TERMS = Object.freeze([
  'model', 'api', 'deprecat', 'sunset', 'shutdown', 'price', 'pricing', 'cost',
  'token', 'security', 'vulnerab', 'auth', 'oauth', 'key', 'quota', 'rate limit',
  'recommend', 'distribution', 'reach', 'ranking', 'creator', 'reels', 'for you',
  'algorithm', 'eligibility', 'sandbox', 'drive', 'cpu', 'billable', 'jwt',
  'storage', 'incident', 'outage', 'breaking', 'sdk',
  'modelo', 'api', 'descontin', 'preço', 'preco', 'custo', 'segurança', 'seguranca',
  'recomend', 'distribuição', 'distribuicao', 'alcance', 'criador', 'algoritmo'
]);

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

export function materialFingerprint(text, terms = DEFAULT_MATERIAL_TERMS) {
  const normalized = String(text ?? '').toLowerCase();
  if (!normalized) return null;
  const windows = [];
  const seen = new Set();

  outer:
  for (const rawTerm of Array.isArray(terms) && terms.length ? terms : DEFAULT_MATERIAL_TERMS) {
    const term = String(rawTerm ?? '').trim().toLowerCase();
    if (!term) continue;
    let cursor = 0;
    while (cursor < normalized.length) {
      const index = normalized.indexOf(term, cursor);
      if (index < 0) break;
      const start = Math.max(0, index - MATERIAL_WINDOW);
      const end = Math.min(normalized.length, index + term.length + MATERIAL_WINDOW);
      const window = normalized.slice(start, end).replace(/\s+/g, ' ').trim();
      if (window && !seen.has(window)) {
        seen.add(window);
        windows.push(window);
        if (windows.length >= MAX_MATERIAL_WINDOWS) break outer;
      }
      cursor = index + Math.max(term.length, 1);
    }
  }
  if (!windows.length) return null;
  return sha256(windows.sort().join('|'));
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
      headers: { 'User-Agent': 'Jarvis-Capability-Radar/2.0 (+official-source-monitor)' }
    });
    const finalUrl = new URL(response.url || source.url);
    if (!source.allowedHosts.includes(finalUrl.hostname)) throw new Error('redirected_to_unapproved_host');
    if (!response.ok) {
      return { key: source.key, kind: source.kind, url: source.url, ok: false, status: response.status, change: 'unavailable', materialChange: 'unavailable' };
    }
    const body = await response.text();
    const normalized = normalizeText(body);
    if (!normalized) {
      return { key: source.key, kind: source.kind, url: source.url, ok: false, status: response.status, change: 'empty', materialChange: 'empty' };
    }

    const hash = sha256(normalized);
    const materialHash = materialFingerprint(normalized, source.materialTerms);
    const priorHash = typeof previous?.hash === 'string' ? previous.hash : null;
    const priorMaterialHash = typeof previous?.materialHash === 'string' ? previous.materialHash : null;
    const change = priorHash === null ? 'baseline_created' : priorHash === hash ? 'unchanged' : 'changed';
    const materialChange = priorMaterialHash === null
      ? 'baseline_created'
      : priorMaterialHash === materialHash
        ? 'unchanged'
        : 'changed';

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
      materialHash,
      materialMatched: Boolean(materialHash),
      change,
      materialChange,
      previousHash: priorHash,
      previousMaterialHash: priorMaterialHash
    };
  } catch (error) {
    return {
      key: source.key,
      kind: source.kind,
      url: source.url,
      ok: false,
      status: null,
      change: 'unavailable',
      materialChange: 'unavailable',
      error: error?.name === 'AbortError' ? 'timeout' : String(error?.message || 'fetch_failed').slice(0, 160)
    };
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
  const materialChanged = results.filter(item => item.materialChange === 'changed');
  const unavailable = results.filter(item => !item.ok);
  const report = {
    schema: 'jarvis-capability-radar-v2',
    configVersion: config.version,
    observedAt,
    changedCount: changed.length,
    materialChangedCount: materialChanged.length,
    unavailableCount: unavailable.length,
    requiresReview: materialChanged.length > 0 || unavailable.length > 0,
    policy: 'A page change alone is noise. Only material-keyword deltas or source outages require supervised review; never change models, strategy or production automatically.',
    results
  };

  const nextState = {
    schema: 'jarvis-capability-radar-state-v2',
    updatedAt: observedAt,
    sources: Object.fromEntries(results.filter(item => item.ok && item.hash).map(item => [item.key, {
      hash: item.hash,
      materialHash: item.materialHash,
      observedAt,
      url: item.url,
      kind: item.kind
    }]))
  };
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await runRadar();
  console.log(JSON.stringify({
    observedAt: report.observedAt,
    changedCount: report.changedCount,
    materialChangedCount: report.materialChangedCount,
    unavailableCount: report.unavailableCount,
    requiresReview: report.requiresReview
  }));
}
