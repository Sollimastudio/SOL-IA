// Normalize natural Brazilian Portuguese reflection cues before heuristic classification.
// This changes only classification input; the original user statement remains preserved verbatim in the vault.
export function normalizeContinuityCues(message) {
  return String(message ?? '')
    .replace(/\bestou\s+aqui\s+pensando\b/gi, 'estou pensando')
    .replace(/\bestava\s+aqui\s+pensando\b/gi, 'estava pensando')
    .replace(/\bfiquei\s+aqui\s+pensando\b/gi, 'fiquei pensando')
    .replace(/\bme\s+peguei\s+pensando\b/gi, 'estou pensando')
    .replace(/\bvenho\s+pensando\b/gi, 'estou pensando');
}
