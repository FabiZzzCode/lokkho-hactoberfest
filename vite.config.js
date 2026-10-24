import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dev only: mounts the same handlers that api/ exports, so `npm run dev` needs no Vercel login.
function devApi(env) {
  Object.assign(process.env, env);
  return {
    name: 'lokkho-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const route = req.url?.split('?')[0].match(/^\/api\/(ai|auth|profile)$/)?.[1];
        if (!route) return next();
        let raw = '';
        for await (const chunk of req) raw += chunk;
        try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
        const mod = await server.ssrLoadModule(`/api/${route}.js`);
        await mod.default(req, res);
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), devApi(loadEnv(mode, process.cwd(), ''))],
  test: { environment: 'node' },
}));
