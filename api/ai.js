import { handleAi } from '../server/handlers/ai.js';
import { toNodeHandler } from '../server/handlers/adapter.js';

export default toNodeHandler(handleAi);
