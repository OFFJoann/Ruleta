import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { db } from '../config/db.js';
import { unauthorized } from './errors.js';

export const TOKEN_COOKIE = 'admin_token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(adminId: number, username: string): string {
  return jwt.sign({ sub: adminId, username }, env.jwtSecret, { expiresIn: '8h' });
}

export interface AdminPayload {
  sub: number;
  username: string;
  id: number;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function authRequired(req: Request, _res: Response, next: NextFunction): void {
  const token = (req.cookies?.[TOKEN_COOKIE] as string | undefined)
    ?? req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    next(unauthorized());
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    const admin = db.prepare('SELECT id, username FROM admins WHERE id = ?').get(Number(payload.sub)) as
      | { id: number; username: string }
      | undefined;
    if (!admin) {
      next(unauthorized());
      return;
    }
    req.admin = { id: admin.id, sub: admin.id, username: admin.username };
    next();
  } catch {
    next(unauthorized('Sesión inválida o expirada'));
  }
}
