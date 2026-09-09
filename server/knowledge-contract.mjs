/** Shared non-secret catalog. Imported text is a source, never an approved fact. */
export const PROJECTS = Object.freeze({
  'morte-em-vida': 'Morte em Vida',
  'reposicione-se': 'Reposicione-se',
  'fuga-identitaria': 'Fuga Identitária',
  'feminicidio-emocional': 'Feminicídio Emocional',
  'eu-nao-desapareco': 'Eu Não Desapareço',
  'marca-e-negocios': 'Marca e negócios',
  'pessoal': 'Pessoal',
  'geral': 'Outros projetos'
});
export const MAX_SOURCE_BYTES = 160000;
export function parseSource(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input.mode !== 'private') throw new Error('private');
  const { projectKey, sourceKey, title, content, expectedVersion } = input;
  if (!Object.hasOwn(PROJECTS, projectKey ?? '') || typeof sourceKey !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,119}$/.test(sourceKey)) throw new Error('input');
  if (typeof title !== 'string' || !title.trim() || title.length > 160 || /[\u0000-\u001f]/.test(title)) throw new Error('input');
  if (typeof content !== 'string' || !content.trim() || /\u0000/.test(content) || !content.isWellFormed() || new TextEncoder().encode(content).length > MAX_SOURCE_BYTES) throw new Error('input');
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0 || expectedVersion > 200) throw new Error('input');
  return { p_project: projectKey, p_source: sourceKey, p_title: title.trim(),
    p_content: content.replace(/\r\n?/g, '\n'), p_expected_version: expectedVersion };
}

export function trustedExcerpts(rows, ownerId) {
  if (!Array.isArray(rows)) throw new Error('response');
  return rows.filter(row => row && row.owner_id === ownerId && Object.hasOwn(PROJECTS, row.project_key ?? '') &&
    typeof row.id === 'string' && typeof row.content === 'string' && row.content.length <= 4000 &&
    typeof row.title === 'string' && Number.isInteger(row.version) && row.version > 0 &&
    Number.isInteger(row.start_char) && row.start_char > 0 && Number.isInteger(row.end_char) && row.end_char >= row.start_char &&
    typeof row.checksum === 'string' && /^[a-f0-9]{64}$/.test(row.checksum))
    .slice(0, 6).map((row, i) => ({ reference: `F${i + 1}`, id: row.id, project: row.project_key,
      title: row.title.slice(0, 160), version: row.version, startChar: row.start_char, endChar: row.end_char,
      checksum: row.checksum, status: 'imported_unverified', content: row.content }));
}
