import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Custom plugin to serve assets from workspace root /assets folder
const serveRootAssets = () => ({
  name: 'serve-root-assets',
  configureServer(server) {
    server.middlewares.use('/assets', (req, res, next) => {
      const filePath = path.join(__dirname, '../assets', req.url.split('?')[0]);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.gif': 'image/gif',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml'
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        return fs.createReadStream(filePath).pipe(res);
      }
      next();
    });
    server.middlewares.use((req, res, next) => {
      if (req.url === '/mutation.gif' || req.url === '/encoding.gif' || req.url === '/recovery.gif' || req.url === '/homepage.gif') {
        const filePath = path.join(__dirname, '../assets', req.url);
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'image/gif');
          return fs.createReadStream(filePath).pipe(res);
        }
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveRootAssets()],
  server: {
    host: true,
    port: 5173,
    fs: {
      allow: ['..'],
    },
  },
})
