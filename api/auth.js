import { handleAuth } from '../server/handlers/auth.js';
import { toNodeHandler } from '../server/handlers/adapter.js';

export default toNodeHandler(handleAuth);
