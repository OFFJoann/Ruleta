import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// En desarrollo el archivo está en src/config; compilado queda en dist/src/config.
const backendDir = here.endsWith(path.join('dist', 'src', 'config'))
  ? path.resolve(here, '../../..')
  : path.resolve(here, '../..');

for (const candidate of [path.resolve(backendDir, '../.env'), path.resolve(backendDir, '.env')]) {
  if (existsSync(candidate)) dotenv.config({ path: candidate, override: false });
}

function str(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function int(key: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[key] ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  port: int('PORT', 4000),
  dbPath: path.resolve(backendDir, str('DB_PATH', './data/ruleta.db')),
  uploadDir: path.resolve(backendDir, str('UPLOAD_DIR', './uploads')),
  maxUploadMb: int('MAX_UPLOAD_MB', 50),
  jwtSecret: str('JWT_SECRET', 'dev-only-secret-change-me'),
  adminUsername: str('ADMIN_USERNAME', 'admin'),
  adminPassword: str('ADMIN_PASSWORD', 'admin1234'),
  corsOrigin: str('CORS_ORIGIN', 'http://localhost:5173'),
  spinRateLimit: int('SPIN_RATE_LIMIT', 30),
  isProduction: process.env.NODE_ENV === 'production',
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production',
};

export { backendDir };
