import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig(() => ({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'customer-portal-spa',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Serve customer portal for /portal/* routes
          if (req.url?.startsWith('/portal') && !req.url.includes('.')) {
            const portalIndexPath = path.resolve(__dirname, 'public/portal/index.html');
            if (fs.existsSync(portalIndexPath)) {
              res.setHeader('Content-Type', 'text/html');
              res.end(fs.readFileSync(portalIndexPath, 'utf-8'));
              return;
            }
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== 'true',
  },
}));
