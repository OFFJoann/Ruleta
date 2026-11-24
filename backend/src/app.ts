import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env, backendDir } from './config/env.js';
import { errorHandler } from './common/errors.js';
import { spinRouter } from './modules/spin/spin.routes.js';
import { publicRouter } from './routes/public.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { uploadRouter } from './routes/upload.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(env.uploadDir, { maxAge: '1d' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  app.use('/api', spinRouter);
  app.use('/api', publicRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/admin', uploadRouter);

  const frontendDist = path.resolve(backendDir, '../frontend/dist');
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado' } });
        return;
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
