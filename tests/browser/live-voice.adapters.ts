// Test-only aliases. No microphone, network, real account or provider calls.
export const GEMINI_LIVE_VOICES = ['Kore', 'Puck'];
export const fixtureSession = { access_token: 'synthetic', user: { id: 'synthetic-owner' } };
export let holdAuth = false;
let releaseAuth: (() => void) | undefined;
export function delayAuthentication() { holdAuth = true; }
export function releaseAuthentication() { holdAuth = false; releaseAuth?.(); }
export async function getCurrentSession() {
  if (holdAuth) await new Promise<void>(resolve => { releaseAuth = resolve; });
  return fixtureSession;
}
export const refreshCurrentSession = getCurrentSession;
let current: any;
export function providerStatus(status: string) { current?.onStatus(status); }
export let clientCount = 0;
export let continuous = false;
export function createGeminiLiveClient(options: any) {
  current = options;
  clientCount++;
  continuous = options.keepAlive;
  let muted = false;
  return {
    connect: async () => options.onStatus('connected'),
    close: async () => options.onStatus('disconnected'),
    disconnect: () => options.onStatus('disconnected'),
    mute: () => { muted = true; return true; },
    unmute: () => { muted = false; return true; },
    isConnected: () => true, isMuted: () => muted, hasFinalUsage: () => false
  };
}
