export type ReadOnlyDomain = 'publisher' | 'narratives' | 'video' | 'meta_ads';

export type ReadOnlySource = {
  id: ReadOnlyDomain;
  label: string;
  purpose: string;
  capabilities: string[];
  repositories: string[];
  allowed: string[];
  blocked: string[];
  integrationStatus: 'catalog_active' | 'api_activation_pending';
};

export const readOnlySources: ReadOnlySource[] = [
  {
    id: 'publisher',
    label: 'Publisher',
    purpose: 'Consultar repertorio editorial para estruturar livros, ebooks, workbooks e revisoes.',
    capabilities: ['arquitetura editorial', 'revisao', 'capitulos', 'formatos de publicacao'],
    repositories: [
      'Sollimastudio/Tronco-ia',
      'Sollimastudio/Narrativas-Chronoscribe',
      'Sollimastudio/sistema-escrita-elite',
      'Sollimastudio/ecossistema-editorial-inteligente'
    ],
    allowed: ['consultar conhecimento', 'produzir rascunho no SOL-IA', 'recomendar estrutura'],
    blocked: ['alterar repositorios-fonte', 'publicar arquivo', 'sobrescrever manuscrito canonico'],
    integrationStatus: 'catalog_active'
  },
  {
    id: 'narratives',
    label: 'Narrativas',
    purpose: 'Consultar modelos de narrativa, conteudo, VSL e reaproveitamento multiformato.',
    capabilities: ['VSL', 'carrossel', 'stories', 'copy', 'conteudo longo e curto'],
    repositories: [
      'Sollimastudio/Narrativas-Chronoscribe',
      'Sollimastudio/universal-legacy-content-engine',
      'Sollimastudio/viralgenix-pro'
    ],
    allowed: ['analisar', 'roteirizar', 'criar rascunho', 'comparar abordagens'],
    blocked: ['publicar automaticamente', 'editar fonte canonica', 'disparar comunicacao'],
    integrationStatus: 'catalog_active'
  },
  {
    id: 'video',
    label: 'Video',
    purpose: 'Consultar processos de roteiro visual, cortes, legendas e preparacao audiovisual.',
    capabilities: ['roteiro visual', 'cortes', 'legendas', 'FFmpeg', 'preparacao para redes'],
    repositories: [
      'Sollimastudio/videoup_app',
      'Sollimastudio/maestro-viral-lab',
      'Sollimastudio/motion-hacker'
    ],
    allowed: ['planejar', 'gerar especificacao', 'recomendar edicao', 'preparar roteiro'],
    blocked: ['publicar video', 'alterar canal', 'executar pipeline externo sem aprovacao'],
    integrationStatus: 'catalog_active'
  },
  {
    id: 'meta_ads',
    label: 'Meta Ads',
    purpose: 'Ler desempenho autorizado e transformar metricas em diagnosticos e recomendacoes.',
    capabilities: ['impressoes', 'alcance', 'cliques', 'CTR', 'CPC', 'CPM', 'gasto', 'acoes'],
    repositories: [
      'Sollimastudio/adscript-ai',
      'Sollimastudio/sol-lima-neuromarketing-agent',
      'Sollimastudio/Sistema-de-Gest-o-de-Campanhas-de-Marketing-Digital-Avan-ado'
    ],
    allowed: ['ler Insights API', 'diagnosticar', 'recomendar', 'registrar hipotese'],
    blocked: ['criar campanha', 'editar anuncio', 'pausar campanha', 'mudar publico', 'alterar orcamento'],
    integrationStatus: 'api_activation_pending'
  }
];
