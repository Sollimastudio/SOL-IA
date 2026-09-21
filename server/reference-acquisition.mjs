import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createHash } from 'node:crypto';
import { ReferenceError, string } from '../core/reference-series.mjs';

export function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 168].includes(b)) ||
      (a === 198 && [18, 19, 51].includes(b)) || (a === 203 && b === 0));
  }
  // Only ordinary global unicast IPv6; excludes mapped IPv4, ULA, link-local, multicast and transition ranges.
  if (isIP(address) === 6) return /^[23][0-9a-f]{3}:/i.test(address) && !/^200[12]:/i.test(address) && !/^2001:db8:/i.test(address);
  return false;
}
export function referenceUrl(value) {
  let url; try { url = new URL(value); } catch { throw new ReferenceError('invalid_url', 'O link não é válido.'); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') ||
    url.hostname.endsWith('.') || !url.hostname.includes('.') || /\.(local|internal|localhost|test|invalid)$/i.test(url.hostname) ||
    (isIP(url.hostname.replace(/^\[|\]$/g, '')) && !publicAddress(url.hostname.replace(/^\[|\]$/g, ''))))
    throw new ReferenceError('unsafe_url', 'Este destino não pode ser consultado pelo serviço de referências.');
  url.hash = '';
  if (url.hostname === 'youtu.be') { const id = url.pathname.slice(1); if (/^[\w-]{11}$/.test(id)) return new URL(`https://www.youtube.com/watch?v=${id}`); }
  if (/(^|\.)youtube\.com$/.test(url.hostname) && url.searchParams.has('v')) return new URL(`https://www.youtube.com/watch?v=${encodeURIComponent(url.searchParams.get('v'))}`);
  for (const key of [...url.searchParams.keys()]) if (/^(utm_|si$|is$)/i.test(key)) url.searchParams.delete(key);
  return url;
}
export async function publicFetch(value, { signal, maxBytes = 250000, resolve = lookup, requestImpl = https.request } = {}) {
  let url = referenceUrl(value);
  const deadline = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(15000)]);
  for (let redirects = 0; redirects <= 3; redirects++) {
    const addresses = await resolve(url.hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(x => !publicAddress(x.address))) throw new ReferenceError('unsafe_dns', 'O destino resolve para uma rede não permitida.');
    const selected = addresses[0];
    const response = await new Promise((resolveResponse, reject) => {
      // Pin the validated address at connection time: no check/use DNS rebinding gap.
      const req = requestImpl(url, { method: 'GET', signal: deadline, headers: { Accept: 'text/html,text/plain,text/vtt,application/json', 'Accept-Encoding': 'identity', 'User-Agent': 'JarvisReference/1.0' },
        lookup: (_host, options, callback) => options?.all ? callback(null, [selected]) : callback(null, selected.address, selected.family) }, res => {
        const chunks = []; let size = 0;
        res.on('data', chunk => { size += chunk.length; if (size > maxBytes) { res.destroy(); reject(new ReferenceError('source_too_large', 'A fonte excede o limite desta aquisição; use o processamento de mídia configurado.', 422)); } else chunks.push(chunk); });
        res.on('end', () => resolveResponse({ status: res.statusCode, headers: res.headers, bytes: Buffer.concat(chunks) }));
        res.on('error', reject);
      }); req.on('error', reject); req.end();
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirects === 3 || !response.headers.location) throw new ReferenceError('redirect_limit', 'A fonte redirecionou além do limite.');
      url = referenceUrl(new URL(response.headers.location, url).href); continue;
    }
    return { ...response, url: url.href };
  }
}
const decode = text => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const cleanHtml = html => decode(html.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const seconds = value => value.replace(',', '.').split(':').reduce((n, part) => n * 60 + Number(part), 0);
export function captionSegments(text) {
  const chunks = text.replace(/\r/g, '').split(/\n\s*\n/), segments = [];
  for (const chunk of chunks) {
    const match = chunk.match(/(?:^|\n)((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})\s+-->\s+((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})[^\n]*\n([\s\S]+)/);
    if (!match) continue; const start = seconds(match[1]), end = seconds(match[2]);
    const content = cleanHtml(match[3]);
    if (Number.isFinite(start) && end > start && content) segments.push({ id: `s${segments.length + 1}`, start, end, text: content.slice(0, 3000) });
  }
  if (!segments.length || segments.length > 500) throw new ReferenceError('invalid_captions', 'Legendas ausentes ou acima do limite; nenhuma transcrição foi inventada.');
  return segments;
}
function textSegments(text) {
  const segments = []; for (let i = 0; i < text.length; i += 1800) segments.push({ id: `s${segments.length + 1}`, start: null, end: null, text: text.slice(i, i + 1800), charStart: i, charEnd: Math.min(i + 1800, text.length) }); return segments;
}
export function referencePacket({ text, title, url = null, method, temporal = false, kind = 'text', limitations = [] }) {
  string(text, 'o conteúdo obtido', 45000, 40);
  const segments = temporal ? captionSegments(text) : textSegments(text);
  return { status: 'ready', title: String(title).slice(0, 200), url, method, kind, acquiredAt: new Date().toISOString(),
    digest: createHash('sha256').update(text).digest('hex'), segments,
    coverage: { text: true, captions: temporal, audio: false, visuals: false, wholeChannel: false, duration: temporal ? Math.max(...segments.map(s => s.end)) : null },
    limitations: [...limitations, ...(temporal ? ['Legendas podem conter erros; não houve escuta nem análise visual.'] : ['Cobertura textual; não houve escuta nem análise visual.'])] };
}
export async function acquireReference(source, { signal, readPublic = publicFetch, mediaAdapter } = {}) {
  const attempts = [];
  if (source.text) return { ...referencePacket({ text: source.text, title: source.title, method: 'user_provided', temporal: source.kind === 'captions', kind: source.kind }), attempts: [{ method: 'user_provided', status: 'ok' }] };
  let url;
  try { url = referenceUrl(source.url).href; } catch (error) { return { status: 'blocked', code: error.code, reason: error.message, attempts, segments: [] }; }
  try {
    const response = await readPublic(url, { signal });
    attempts.push({ method: 'public_https', status: response.status });
    if (response.status >= 200 && response.status < 300) {
      const contentType = String(response.headers['content-type'] || '').toLowerCase();
      const text = response.bytes.toString('utf8');
      const youtube = /(^|\.)youtube\.com$/.test(new URL(url).hostname);
      if (!youtube && source.kind !== 'channel' && /text\/(plain|markdown|vtt)|application\/x-subrip/.test(contentType))
        return { ...referencePacket({ text, title: source.title, url: response.url, method: 'public_https', temporal: /vtt|subrip/.test(contentType) || /^WEBVTT/.test(text), kind: source.kind }), attempts };
      if (!youtube && source.kind !== 'channel' && contentType.includes('text/html')) {
        const track = text.match(/<track\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
        if (track) {
          const captions = await readPublic(new URL(decode(track[1]), response.url).href, { signal });
          attempts.push({ method: 'html_caption_track', status: captions.status });
          if (captions.status === 200) return { ...referencePacket({ text: captions.bytes.toString('utf8'), title: source.title, url, method: 'html_caption_track', temporal: true, kind: 'video' }), attempts };
        }
        if (!/<(?:video|audio|iframe)\b/i.test(text)) {
          const main = text.match(/<(?:article|main)\b[^>]*>([\s\S]*?)<\/(?:article|main)>/i)?.[1] || text;
          return { ...referencePacket({ text: cleanHtml(main), title: decode(text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || source.title), url: response.url, method: 'html_text', kind: 'page', limitations: ['Somente o texto disponível nesta página foi lido.'] }), attempts };
        }
      }
    }
  } catch (error) { attempts.push({ method: 'public_https', status: error.code || 'transport_failed' }); if (['unsafe_dns', 'unsafe_url'].includes(error.code)) return { status: 'blocked', code: error.code, reason: error.message, attempts, segments: [] }; }
  if (mediaAdapter) {
    try {
      const result = await mediaAdapter({ url, kind: source.kind, signal });
      if (result?.status === 'ready' || result?.status === 'partial') {
        const packet = referencePacket({ text: string(result.transcript, 'a transcrição do conector', 45000, 40), title: result.title || source.title, url, method: 'authorized_media_adapter', temporal: result.format === 'vtt', kind: source.kind });
        packet.status = result.status; packet.coverage.audio = result.audioProcessed === true;
        packet.coverage.visuals = false; // Visual evidence needs its own validated pipeline, not a provider's boolean.
        packet.limitations = ['Resultado do conector configurado; cobertura visual não verificada.', ...(Array.isArray(result.limitations) ? result.limitations.filter(x => typeof x === 'string').slice(0, 10) : [])];
        if (source.kind === 'channel') {
          if (!Array.isArray(result.sample) || !result.sample.length || result.sample.length > 10) throw new ReferenceError('invalid_sample', 'A análise do canal precisa identificar a amostra.');
          packet.sample = result.sample.map(s => ({ title: string(s.title, 'o título da amostra', 200), url: referenceUrl(s.url).href }));
          packet.limitations.push('Amostra limitada aos itens listados; não representa todo o canal.');
        }
        attempts.push({ method: 'authorized_media_adapter', status: 'ok' }); return { ...packet, attempts };
      }
      attempts.push({ method: 'authorized_media_adapter', status: String(result?.code || 'no_transcript').slice(0, 80) });
    } catch { attempts.push({ method: 'authorized_media_adapter', status: 'adapter_failed' }); }
  }
  if (!mediaAdapter && attempts.length === 1 && ['EAI_AGAIN', 'ENOTFOUND', 'ENETUNREACH', 'ECONNREFUSED', 'transport_failed', 'ABORT_ERR'].includes(attempts[0].status))
    return { status: 'blocked', code: 'source_network_unavailable', url, reason: `A conexão com a fonte falhou (${attempts[0].status}). O conteúdo não foi lido; o link está salvo para retomada.`, attempts, segments: [], coverage: { text: false, captions: false, audio: false, visuals: false, wholeChannel: false } };
  return { status: 'blocked', code: mediaAdapter ? 'content_unavailable' : 'media_connector_required', url,
    reason: mediaAdapter ? 'As tentativas não retornaram conteúdo verificável. Confira o acesso do conector à fonte.' : 'A página não forneceu texto/legendas utilizáveis e o conector de mídia ainda não está configurado. O link ficou salvo para retomada.',
    attempts, segments: [], coverage: { text: false, captions: false, audio: false, visuals: false, wholeChannel: false } };
}
