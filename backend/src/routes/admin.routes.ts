import { Router } from 'express';
import { authRequired, hashPassword, signToken, TOKEN_COOKIE, verifyPassword } from '../common/auth.js';
import { asyncHandler, badRequest, conflict, notFound, unauthorized } from '../common/errors.js';
import { logAudit } from '../common/audit.js';
import { db, nowIso, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { codeSchema, loginSchema, prizeSchema, statusSchema } from '../common/schemas.js';
import { getSetting, setSetting, type SettingsMap } from '../common/settings.js';
import {
  createPrize,
  deletePrize,
  getAllPrizes,
  getPrize,
  setPrizeActive,
  updatePrize,
  validatePrizeInput,
} from '../modules/prizes/prizes.service.js';

export const adminRouter = Router();
const keySchema = /^[a-z]+$/;

adminRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as
      | { id: number; username: string; password_hash: string }
      | undefined;
    if (!admin || !(await verifyPassword(password, admin.password_hash))) {
      throw unauthorized('Usuario o contraseña incorrectos');
    }
    const token = signToken(admin.id, admin.username);
    res.cookie(TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.cookieSecure,
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });
    logAudit(admin.id, 'LOGIN', 'admin', admin.id, 'Inicio de sesión', req.ip);
    res.json({ id: admin.id, username: admin.username });
  }),
);

adminRouter.post(
  '/logout',
  authRequired,
  asyncHandler((req, res) => {
    res.clearCookie(TOKEN_COOKIE, { path: '/' });
    logAudit(req.admin!.id, 'LOGOUT', 'admin', req.admin!.id, 'Cierre de sesión', req.ip);
    res.json({ ok: true });
  }),
);

adminRouter.get('/me', authRequired, (req, res) => res.json(req.admin));

adminRouter.post(
  '/password',
  authRequired,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      throw badRequest('La nueva contraseña debe tener al menos 8 caracteres');
    }
    const admin = db.prepare('SELECT password_hash FROM admins WHERE id = ?').get(req.admin!.id) as
      | { password_hash: string }
      | undefined;
    if (!admin || !(await verifyPassword(currentPassword, admin.password_hash))) {
      throw unauthorized('Contraseña actual incorrecta');
    }
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(
      await hashPassword(newPassword),
      req.admin!.id,
    );
    logAudit(req.admin!.id, 'PASSWORD_CHANGE', 'admin', req.admin!.id, '', req.ip);
    res.json({ ok: true });
  }),
);

adminRouter.use(authRequired);

/* ------------------------------- PREMIOS -------------------------------- */

adminRouter.get('/prizes', (_req, res) => res.json(getAllPrizes()));

adminRouter.get(
  '/prizes/:id',
  asyncHandler((req, res) => {
    const prize = getPrize(Number(req.params.id));
    if (!prize) throw notFound('Premio no encontrado');
    res.json(prize);
  }),
);

adminRouter.post(
  '/prizes',
  asyncHandler((req, res) => {
    const parsed = prizeSchema.parse(req.body);
    const input = { ...parsed, is_unlimited: Number(parsed.is_unlimited), active: Number(parsed.active), is_consolation: Number(parsed.is_consolation) };
    validatePrizeInput(input as never);
    const prize = createPrize(input as never);
    logAudit(req.admin!.id, 'CREATE', 'prize', prize.id, prize.name, req.ip);
    res.status(201).json(prize);
  }),
);

adminRouter.put(
  '/prizes/:id',
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    const parsed = prizeSchema.parse(req.body);
    const existing = getPrize(id);
    if (!existing) throw notFound('Premio no encontrado');
    const history = db
      .prepare('SELECT COUNT(*) AS count FROM participations WHERE prize_id = ?')
      .get(id) as { count: number };
    if (parsed.delivered < history.count) {
      throw badRequest(`No puedes reducir los entregados por debajo de las ${history.count} participaciones registradas`);
    }
    const input = { ...parsed, is_unlimited: Number(parsed.is_unlimited), active: Number(parsed.active), is_consolation: Number(parsed.is_consolation) };
    validatePrizeInput(input as never);
    const prize = updatePrize(id, input as never);
    logAudit(req.admin!.id, 'UPDATE', 'prize', id, prize.name, req.ip);
    res.json(prize);
  }),
);

adminRouter.patch(
  '/prizes/:id/active',
  asyncHandler((req, res) => {
    const active = Boolean(req.body?.active);
    const prize = setPrizeActive(Number(req.params.id), active);
    logAudit(req.admin!.id, active ? 'ACTIVATE' : 'DEACTIVATE', 'prize', prize.id, prize.name, req.ip);
    res.json(prize);
  }),
);

adminRouter.delete(
  '/prizes/:id',
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    const prize = getPrize(id);
    if (!prize) throw notFound('Premio no encontrado');
    deletePrize(id);
    logAudit(req.admin!.id, 'DELETE', 'prize', id, prize.name, req.ip);
    res.json({ ok: true });
  }),
);

/* ------------------------------ SETTINGS -------------------------------- */

adminRouter.get(
  '/settings/:key',
  asyncHandler((req, res) => {
    const key = String(req.params.key);
    if (!keySchema.test(key) || !(key in defaultSettingKeys)) throw notFound('Configuración no encontrada');
    res.json(getSetting(key as keyof SettingsMap));
  }),
);

const defaultSettingKeys: Record<string, true> = { theme: true, promotion: true, whatsapp: true };

adminRouter.put(
  '/settings/:key',
  asyncHandler((req, res) => {
    const key = String(req.params.key);
    if (!keySchema.test(key) || !(key in defaultSettingKeys)) throw notFound('Configuración no encontrada');
    const typedKey = key as keyof SettingsMap;
    const merged = { ...getSetting(typedKey), ...req.body };
    setSetting(typedKey, merged);
    logAudit(req.admin!.id, 'UPDATE', 'settings', key, '', req.ip);
    res.json(merged);
  }),
);

/* --------------------------- PARTICIPACIONES ---------------------------- */

interface ParticipationRow {
  id: number;
  participation_uid: string;
  name: string;
  phone: string;
  prize_id: number | null;
  prize_name_snapshot: string;
  code: string;
  status: string;
  redeemed_at: string | null;
  result_message_snapshot: string;
  created_at: string;
}

function participationQuery(req: { query: Record<string, unknown> }): {
  sql: string;
  params: Array<string | number>;
} {
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  const { from, to, prizeId, status, search } = req.query;
  if (from) {
    clauses.push('date(created_at) >= date(?)');
    params.push(String(from));
  }
  if (to) {
    clauses.push('date(created_at) <= date(?)');
    params.push(String(to));
  }
  if (prizeId) {
    clauses.push('prize_id = ?');
    params.push(Number(prizeId));
  }
  if (status) {
    clauses.push('status = ?');
    params.push(String(status));
  }
  if (search) {
    clauses.push('(name LIKE ? OR phone LIKE ? OR code LIKE ?)');
    const term = `%${String(search)}%`;
    params.push(term, term, term);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return {
    sql: `SELECT * FROM participations ${where} ORDER BY created_at DESC, id DESC`,
    params,
  };
}

adminRouter.get(
  '/participations',
  asyncHandler((req, res) => {
    const { sql, params } = participationQuery(req as never);
    const limit = Math.min(Number(req.query.limit ?? 500), 5000);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);
    const rows = db.prepare(`${sql} LIMIT ? OFFSET ?`).all(...params, limit, offset) as unknown as ParticipationRow[];
    const total = (db.prepare(`SELECT COUNT(*) AS count FROM participations ${sql.substring(sql.indexOf('WHERE') === -1 ? sql.length : sql.indexOf('WHERE'))}`).get(...params) as { count: number }).count;
    res.json({ rows, total });
  }),
);

adminRouter.get(
  '/participations/export.csv',
  asyncHandler((req, res) => {
    const { sql, params } = participationQuery(req as never);
    const rows = db.prepare(sql).all(...params) as unknown as ParticipationRow[];
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = ['ID', 'Participación', 'Nombre', 'WhatsApp', 'Premio', 'Código', 'Estado', 'Fecha', 'Mensaje'];
    const lines = [header.map(escape).join(',')];
    for (const row of rows) {
      lines.push(
        [
          row.id, row.participation_uid, row.name, row.phone, row.prize_name_snapshot,
          row.code, row.status, row.created_at, row.result_message_snapshot,
        ].map(escape).join(','),
      );
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="participaciones-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(`\uFEFF${lines.join('\r\n')}`);
  }),
);

adminRouter.patch(
  '/participations/:id/status',
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    const status = statusSchema.parse(req.body?.status);
    const row = db.prepare('SELECT id FROM participations WHERE id = ?').get(id);
    if (!row) throw notFound('Participación no encontrada');
    db.prepare('UPDATE participations SET status = ?, redeemed_at = ? WHERE id = ?').run(
      status,
      status === 'reclamado' ? nowIso() : null,
      id,
    );
    logAudit(req.admin!.id, 'STATUS_CHANGE', 'participation', id, status, req.ip);
    res.json({ ok: true });
  }),
);

/* -------------------------------- CÓDIGOS ------------------------------- */

adminRouter.post(
  '/codes/validate',
  asyncHandler((req, res) => {
    const { code } = codeSchema.parse(req.body);
    const row = db.prepare('SELECT * FROM participations WHERE code = ?').get(code.toUpperCase()) as
      | ParticipationRow
      | undefined;
    if (!row) throw notFound('Código no encontrado');
    res.json({ ...row, valid: row.status === 'pendiente' });
  }),
);

adminRouter.post(
  '/codes/redeem',
  asyncHandler((req, res) => {
    const { code } = codeSchema.parse(req.body);
    const result = withTransaction(() => {
      const row = db.prepare('SELECT * FROM participations WHERE code = ?').get(code.toUpperCase()) as
        | ParticipationRow
        | undefined;
      if (!row) throw notFound('Código no encontrado');
      if (row.status !== 'pendiente') {
        throw conflict(`Este código ya fue ${row.status === 'reclamado' ? 'canjeado' : row.status}`);
      }
      db.prepare("UPDATE participations SET status = 'reclamado', redeemed_at = ? WHERE id = ? AND status = 'pendiente'").run(
        nowIso(),
        row.id,
      );
      return { ...row, status: 'reclamado' };
    });
    logAudit(req.admin!.id, 'REDEEM', 'code', result.code, result.prize_name_snapshot, req.ip);
    res.json(result);
  }),
);

/* ------------------------------- ESTADÍSTICAS --------------------------- */

adminRouter.get(
  '/stats',
  asyncHandler((_req, res) => {
    const total = (db.prepare('SELECT COUNT(*) AS count FROM participations').get() as { count: number }).count;
    const delivered = (db.prepare('SELECT COALESCE(SUM(delivered),0) AS count FROM prizes').get() as { count: number }).count;
    const available = (db.prepare(
      'SELECT COALESCE(SUM(CASE WHEN is_unlimited = 1 THEN 0 ELSE MAX(quantity - delivered, 0) END),0) AS count FROM prizes WHERE active = 1',
    ).get() as { count: number }).count;
    const exhausted = (db.prepare(
      'SELECT COUNT(*) AS count FROM prizes WHERE active = 1 AND is_unlimited = 0 AND delivered >= quantity',
    ).get() as { count: number }).count;
    const courtesies = (db.prepare(
      "SELECT COUNT(*) AS count FROM participations WHERE LOWER(prize_name_snapshot) LIKE '%cortes%'",
    ).get() as { count: number }).count;
    const discounts = (db.prepare(
      "SELECT COUNT(*) AS count FROM participations WHERE LOWER(prize_name_snapshot) LIKE '%descuent%'",
    ).get() as { count: number }).count;
    const today = (db.prepare(
      "SELECT COUNT(*) AS count FROM participations WHERE date(created_at) = date('now')",
    ).get() as { count: number }).count;
    const recent = db.prepare(
      'SELECT name, phone, prize_name_snapshot, code, status, created_at FROM participations ORDER BY id DESC LIMIT 8',
    ).all();
    const byPrize = db.prepare(
      `SELECT p.id, p.name, p.icon, p.color, p.probability AS original_probability, p.quantity, p.delivered,
              COUNT(pt.id) AS participations
       FROM prizes p LEFT JOIN participations pt ON pt.prize_id = p.id
       GROUP BY p.id ORDER BY p.position, p.id`,
    ).all();
    res.json({ total, delivered, available, exhausted, courtesies, discounts, today, recent, byPrize });
  }),
);

adminRouter.get(
  '/audit',
  asyncHandler((req, res) => {
    const rows = db.prepare(
      `SELECT a.*, adm.username FROM audit_logs a LEFT JOIN admins adm ON adm.id = a.admin_id
       ORDER BY a.id DESC LIMIT ?`,
    ).all(Math.min(Number(req.query.limit ?? 200), 2000));
    res.json(rows);
  }),
);
