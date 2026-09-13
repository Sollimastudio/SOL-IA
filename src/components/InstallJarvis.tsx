import { useEffect, useRef, useState } from 'react';
import { installPlatform } from '../core/installTarget.mjs';

type InstallPrompt = Event & {
  prompt(): Promise<unknown>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
const inStandalone = () => window.matchMedia('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function InstallJarvis() {
  const [standalone, setStandalone] = useState(inStandalone);
  const [installed, setInstalled] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [notice, setNotice] = useState('');
  const promptRef = useRef<InstallPrompt | null>(null);
  const mounted = useRef(false);
  const platform = installPlatform(navigator);

  useEffect(() => {
    mounted.current = true;
    const display = window.matchMedia('(display-mode: standalone)');
    const onDisplay = () => setStandalone(inStandalone());
    const onPrompt = (event: Event) => {
      const candidate = event as InstallPrompt;
      if (typeof candidate.prompt !== 'function' || !candidate.userChoice) return;
      event.preventDefault();
      promptRef.current = candidate;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      promptRef.current = null;
      setCanPrompt(false);
      setInstalled(true);
    };
    display.addEventListener('change', onDisplay);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      mounted.current = false;
      promptRef.current = null;
      display.removeEventListener('change', onDisplay);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    const pending = promptRef.current;
    if (!pending) return;
    // Consume synchronously: double taps cannot launch a second prompt.
    promptRef.current = null;
    setCanPrompt(false);
    try {
      await pending.prompt(); // Must stay inside the explicit user gesture.
      const choice = await pending.userChoice;
      if (!mounted.current) return;
      setNotice(choice.outcome === 'accepted'
        ? 'Pedido aceito pelo navegador. Aguarde a instalação e procure o ícone Jarvis.'
        : 'Você pode instalar depois. Sua conversa continua aqui.');
    } catch {
      if (mounted.current) setNotice('O navegador não abriu a instalação. Use as instruções abaixo; sua conversa continua aqui.');
    }
  }

  if (standalone) return <p className="install-state">Aberto pelo ícone do Jarvis</p>;
  if (installed) return <p className="install-state" role="status" aria-label="Instalação do Jarvis">Instalação confirmada pelo navegador. Na próxima vez, abra o ícone Jarvis.</p>;

  return <details className="install-guide">
    <summary><img src="/jarvis-icon-192.png" alt="" width="32" height="32" />
      <span>Colocar Jarvis na tela inicial<small>Abra pelo ícone, sem procurar esta conversa.</small></span>
    </summary>
    <div className="install-instructions">
      {canPrompt && <button type="button" className="button" onClick={() => void install()}>Instalar Jarvis</button>}
      {notice && <p role="status" aria-label="Instalação do Jarvis">{notice}</p>}
      {platform === 'ios' ? <>
        <ol>
          <li>Toque em <strong>Compartilhar</strong> no navegador — o quadrado com a seta para cima.</li>
          <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
          <li>Se aparecer <strong>Abrir como App da Web</strong>, deixe ativado. Confirme <strong>Adicionar</strong>.</li>
        </ol>
        <p>Não apareceu a opção? Abra esta página no Safari (ícone de bússola, quando disponível) e toque em Compartilhar novamente. No Safari, ela também pode estar em Editar Ações.</p>
      </> : <ol>
        <li>Abra o menu do navegador{platform === 'android' ? ' (três pontos)' : ''}.</li>
        <li>Procure <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong> e confirme.{platform === 'desktop' && ' No Safari do Mac, use Arquivo → Adicionar ao Dock.'}</li>
        <li>Na próxima vez, abra o ícone <strong>Jarvis</strong>.</li>
      </ol>}
      <p className="status-text">No primeiro acesso pelo ícone, pode ser necessário entrar uma vez nesse novo ambiente. Você não precisa sair da sessão atual.</p>
      <details className="install-limits"><summary>Sobre acesso e voz</summary>
        <p>O Jarvis ainda está em uma prévia protegida. O ícone não remove a proteção da hospedagem nem comprova que a sessão continuará conectada.</p>
        <p>Requer internet. Instalar não ativa microfone nem escuta com a tela bloqueada.</p>
      </details>
    </div>
  </details>;
}
