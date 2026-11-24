import { createApp } from './app.js';
import { db, migrate } from './config/db.js';
import { env } from './config/env.js';
import { ensureDefaultSettings } from './common/settings.js';

migrate();
ensureDefaultSettings();

const adminCount = db.prepare('SELECT COUNT(*) AS count FROM admins').get() as { count: number };
if (adminCount.count === 0) {
  console.warn('⚠  No hay administradores. Ejecuta: npm run seed');
}

const app = createApp();
app.listen(env.port, () => {
  console.log(`🚀 API ruleta escuchando en http://localhost:${env.port}`);
});
