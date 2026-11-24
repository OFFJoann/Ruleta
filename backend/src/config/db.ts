import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { env, backendDir } from './env.js';

const migrationsDir = path.join(backendDir, 'migrations');

mkdirSync(path.dirname(env.dbPath), { recursive: true });
mkdirSync(env.uploadDir, { recursive: true });

export const db = new DatabaseSync(env.dbPath);

db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA busy_timeout = 10000');
db.exec('PRAGMA synchronous = NORMAL');

export function migrate(): void {
  const files = ['001_init.sql'];
  for (const file of files) {
    db.exec(readFileSync(path.join(migrationsDir, file), 'utf8'));
  }
}

/**
 * Transacción atómica con bloqueo de escritura (BEGIN IMMEDIATE).
 * Garantiza que el inventario y la participación se modifiquen juntos,
 * incluso si dos usuarios giran exactamente al mismo tiempo.
 */
export function withTransaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      /* rollback fallido: se propaga el error original */
    }
    throw error;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export type Row = Record<string, unknown>;
