import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './db.js'; // initialize database + seed
import { kidRouter } from './routesKid.js';
import { aiRouter } from './routesAi.js';
import { adminRouter } from './routesAdmin.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', kidRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);

// Production: serve the built frontend (web/dist) with an SPA fallback.
// In dev this folder may not exist — vite (port 5173) serves the UI instead.
const here = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(here, '../../web/dist');
if (fs.existsSync(path.join(webDist, 'index.html'))) {
  app.use(express.static(webDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(webDist, 'index.html'));
    }
    next();
  });
  console.log('Serving frontend from', webDist);
}

const port = parseInt(process.env.PORT || '8787', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`Math Pal server running at http://localhost:${port}`);
});
