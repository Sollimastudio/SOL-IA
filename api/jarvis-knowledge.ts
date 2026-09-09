import { createKnowledgeHandler } from '../server/jarvis-knowledge.mjs';
export default { fetch: createKnowledgeHandler({ env: process.env }) };
