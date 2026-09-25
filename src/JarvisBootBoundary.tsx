import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean; code: string };

function safeCode(error: unknown): string {
  const name = error instanceof Error && error.name ? error.name : 'BOOT_ERROR';
  let hash = 2166136261;
  for (const char of name) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `JRV-${(hash >>> 0).toString(16).slice(0, 8).toUpperCase()}`;
}

export class JarvisBootBoundary extends Component<Props, State> {
  state: State = { failed: false, code: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { failed: true, code: safeCode(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[JARVIS_BOOT_ERROR]', {
      code: this.state.code || safeCode(error),
      componentStackPresent: Boolean(info.componentStack)
    });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main>
      <section className="shell jarvis-boot-failure" role="alert">
        <p className="eyebrow">JARVIS · DIAGNÓSTICO DE INICIALIZAÇÃO</p>
        <h1>Jarvis não conseguiu iniciar.</h1>
        <p>O aplicativo encontrou uma falha antes de concluir a abertura. Nenhum segredo foi exibido.</p>
        <p className="jarvis-boot-code">Código: {this.state.code || 'JRV-BOOT'}</p>
        <button className="button" type="button" onClick={() => window.location.reload()}>RECARREGAR</button>
      </section>
    </main>;
  }
}
