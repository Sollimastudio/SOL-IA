export function createVoiceSession(): {
  start(consent: boolean): boolean;
  stop(): void;
  isActive(): boolean;
  isEngaged(): boolean;
  ticket(): number;
  isCurrent(ticket: number): boolean;
  accept(text: string): { kind: 'ignored' } | { kind: 'stop' } | { kind: 'message'; text: string };
};
