import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

const mockApiPlugin = (): Plugin => ({
  name: 'mock-api',
  configureServer(server) {
    server.middlewares.use('/api/surmiser-suggest', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        setTimeout(() => {
          try {
            const { text } = JSON.parse(body);
            const prefix = text || '';

            const suggestion = prefix.endsWith('hello') ? ' world' : '';

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                suggestion,
                confidence: suggestion ? 90 : 0,
              })
            );
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error: unknown) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        }, 1000);
      });
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
