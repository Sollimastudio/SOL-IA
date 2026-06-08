export type ProjectBox = 'OBRA' | 'METODO' | 'OFERTA' | 'MAQUINA' | 'ESTACIONAMENTO';

export function classifyInput(input: string): ProjectBox {
  const text = input.toLowerCase();
  const isNightCapture = /3 da manha|madrugada|perdi o sono|insonia|nao consigo dormir|acordei/.test(text);
  const isImpulseDecision = /comprar|assinar|fechar|parceria|investir|contrato|urgente|agora/.test(text);

  if (isNightCapture && isImpulseDecision) return 'ESTACIONAMENTO';

  if (/livro|capitulo|historia|oripe|mae|pai|infancia|manuscrito|cena/.test(text)) return 'OBRA';
  if (/metodo|posicione|relacione|arvore|cajueiro|discernimento|comando/.test(text)) return 'METODO';
  if (/magnetus|antidoto|vender|oferta|pagina|story|reels|anuncio|copy|conteudo|cliente|funil|mentoria|curso|produto|parceria comercial/.test(text)) return 'OFERTA';
  if (/app|github|supabase|vercel|api|codigo|software|publisher|sol\.ia|jarvis|ferramenta|plugin|integracao|automacao|dashboard|sistema/.test(text)) return 'MAQUINA';

  return 'ESTACIONAMENTO';
}

export function buildInternalPrompt(input: string): string {
  const box = classifyInput(input);
  return [
    'Atue como Sol.IA — Eu Nao Desapareco.',
    'Nao dependa da qualidade literal do pedido da Sol.',
    `Classificacao: ${box}.`,
    'Identifique a necessidade real, construa o prompt profissional interno e entregue resultado util.',
    'Proteja fatos intocaveis e nao abra opcoes demais.',
    'Se for madrugada com impulso de compra, contrato, publicacao ou parceria, capture e estacione antes de executar.',
    `Entrada bruta: ${input}`
  ].join('\n');
}
