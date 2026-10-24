import { handleAgent } from '../server/handlers/agent.js';
import { toNodeHandler } from '../server/handlers/adapter.js';

export default toNodeHandler(handleAgent);
