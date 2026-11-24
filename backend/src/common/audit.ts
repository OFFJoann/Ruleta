import { db } from '../config/db.js';

export function logAudit(
  adminId: number | null,
  action: string,
  entity: string,
  entityId: string | number = '',
  details: string = '',
  ip: string = '',
): void {
  db.prepare(
    `INSERT INTO audit_logs (admin_id, action, entity, entity_id, details, ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(adminId, action, entity, String(entityId), details, ip);
}
