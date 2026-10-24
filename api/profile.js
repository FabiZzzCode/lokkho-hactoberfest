import { handleProfile } from '../server/handlers/profile.js';
import { toNodeHandler } from '../server/handlers/adapter.js';

export default toNodeHandler(handleProfile);
