export type ProjectBox = 'OBRA' | 'METODO' | 'OFERTA' | 'MAQUINA' | 'ESTACIONAMENTO';

export function classifyInput(input: string): ProjectBox {
  const text = input.toLowerCase();

  if (/livro|capitulo|historia|oripe|mae|pai|infancia|manuscrito|cena/.test(text)) return 'OBRA';
  if (/metodo|posicione|relacione|arvore|cajueiro|discernimento|comando/.test(text)) return 'METODO';
  if (/magnetus|antidoto|vender|oferta|pagina|story|reels|anuncio|copy|conteudo/.test(text)) return 'OFERTA';
  if (/app|github|supabase|vercel|api|codigo|software|publisher|sol\.ia|jarvis/.test(text)) return 'MAQUINA';

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
    `Entrada bruta: ${input}`
  ].join('\n');
}
