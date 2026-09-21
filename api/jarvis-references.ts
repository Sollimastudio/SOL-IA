import { createReferencesHandler } from '../server/jarvis-references.mjs';

export default { fetch(request: Request) { return createReferencesHandler({ env: process.env })(request); } };
