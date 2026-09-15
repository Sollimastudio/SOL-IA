import { prepareJarvisSpeech } from './core/jarvisSpeech';

const ACK_TEXT = 'Tô aqui. Pode falar.';
let lastSpokenAt = 0;

function speakWakeAcknowledgement() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const now = Date.now();
  if (now - lastSpokenAt < 2500) return;
  lastSpokenAt = now;
  const utterance = prepareJarvisSpeech(new SpeechSynthesisUtterance(ACK_TEXT));
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function inspectStatus() {
  const nodes = document.querySelectorAll<HTMLElement>('[role="status"]');
  for (const node of nodes) {
    if (node.textContent?.trim() === ACK_TEXT) {
      speakWakeAcknowledgement();
      return;
    }
  }
}

const observer = new MutationObserver(inspectStatus);

function start() {
  if (!document.body) return;
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  inspectStatus();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
