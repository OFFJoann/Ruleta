import { db, nowIso } from '../../config/db.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';

export interface Prize {
  id: number;
  name: string;
  description: string;
  image_url: string;
  icon: string;
  color: string;
  probability: number;
  quantity: number;
  is_unlimited: number;
  delivered: number;
  active: number;
  is_consolation: number;
  position: number;
  result_title: string;
  result_message: string;
  result_description: string;
  celebration_image_url: string;
  claim_instructions: string;
  expires_at: string;
  terms: string;
  whatsapp_button_text: string;
  whatsapp_number: string;
  whatsapp_message: string;
  created_at: string;
  updated_at: string;
}

export type PrizeInput = Omit<Prize, 'id' | 'delivered' | 'created_at' | 'updated_at'> & {
  delivered?: number;
};

export interface PrizeSegment {
  id: number;
  name: string;
  icon: string;
  color: string;
  imageUrl: string;
  description: string;
  isConsolation: boolean;
}

export function toSegment(prize: Prize): PrizeSegment {
  return {
    id: prize.id,
    name: prize.name,
    icon: prize.icon,
    color: prize.color,
    imageUrl: prize.image_url,
    description: prize.description,
    isConsolation: Boolean(prize.is_consolation),
  };
}

export function isAvailable(prize: Prize): boolean {
  return Boolean(prize.active) && (Boolean(prize.is_unlimited) || prize.delivered < prize.quantity);
}

/** Premios que pueden dibujarse y ser seleccionados en este momento. */
export function getEligiblePrizes(): Prize[] {
  return db
    .prepare(
      `SELECT * FROM prizes
       WHERE active = 1 AND (is_unlimited = 1 OR delivered < quantity)
       ORDER BY position ASC, id ASC`,
    )
    .all() as unknown as Prize[];
}

export function getAllPrizes(): Array<Prize & { effectiveProbability: number; available: boolean }> {
  const prizes = db.prepare('SELECT * FROM prizes ORDER BY position ASC, id ASC').all() as unknown as Prize[];
  const eligible = prizes.filter(isAvailable);
  const total = eligible.reduce((sum, prize) => sum + Math.max(0, prize.probability), 0);
  return prizes.map((prize) => ({
    ...prize,
    available: isAvailable(prize),
    effectiveProbability:
      isAvailable(prize) && total > 0 ? (Math.max(0, prize.probability) / total) * 100 : 0,
  }));
}

export function getPrize(id: number): Prize | undefined {
  return db.prepare('SELECT * FROM prizes WHERE id = ?').get(id) as Prize | undefined;
}

const columns = [
  'name', 'description', 'image_url', 'icon', 'color', 'probability', 'quantity',
  'is_unlimited', 'delivered', 'active', 'is_consolation', 'position',
  'result_title', 'result_message', 'result_description', 'celebration_image_url',
  'claim_instructions', 'expires_at', 'terms', 'whatsapp_button_text',
  'whatsapp_number', 'whatsapp_message',
] as const;

export function createPrize(input: PrizeInput): Prize {
  const values = columns.map((column) => {
    const value = input[column];
    return typeof value === 'boolean' ? Number(value) : value ?? '';
  });
  const result = db
    .prepare(
      `INSERT INTO prizes (${columns.join(', ')}, created_at, updated_at)
       VALUES (${columns.map(() => '?').join(', ')}, ?, ?)`,
    )
    .run(...values, nowIso(), nowIso());
  const created = getPrize(Number(result.lastInsertRowid));
  if (!created) throw conflict('No se pudo crear el premio');
  return created;
}

export function updatePrize(id: number, input: PrizeInput): Prize {
  const existing = getPrize(id);
  if (!existing) throw notFound('Premio no encontrado');
  const values = columns.map((column) => {
    const value = input[column];
    return typeof value === 'boolean' ? Number(value) : value ?? '';
  });
  db.prepare(
    `UPDATE prizes SET ${columns.map((column) => `${column} = ?`).join(', ')}, updated_at = ? WHERE id = ?`,
  ).run(...values, nowIso(), id);
  return getPrize(id)!;
}

export function deletePrize(id: number): void {
  const prize = getPrize(id);
  if (!prize) throw notFound('Premio no encontrado');
  const participations = db
    .prepare('SELECT COUNT(*) AS count FROM participations WHERE prize_id = ?')
    .get(id) as { count: number };
  if (participations.count > 0) {
    throw conflict(
      `Este premio tiene ${participations.count} participaciones asociadas. Desactívalo para conservar el historial.`,
    );
  }
  db.prepare('DELETE FROM prizes WHERE id = ?').run(id);
}

export function setPrizeActive(id: number, active: boolean): Prize {
  const prize = getPrize(id);
  if (!prize) throw notFound('Premio no encontrado');
  db.prepare('UPDATE prizes SET active = ?, updated_at = ? WHERE id = ?').run(
    active ? 1 : 0,
    nowIso(),
    id,
  );
  return getPrize(id)!;
}

export function validatePrizeInput(input: PrizeInput): void {
  if (!input.name.trim()) throw badRequest('El nombre del premio es obligatorio');
  if (input.probability < 0) throw badRequest('La probabilidad no puede ser negativa');
  if (!input.is_unlimited && input.quantity < 1) {
    throw badRequest('La cantidad debe ser al menos 1 o marcar el premio como ilimitado');
  }
  if (Number(input.delivered ?? 0) < 0) throw badRequest('Los entregados no pueden ser negativos');
  if (!input.is_unlimited && Number(input.delivered ?? 0) > Number(input.quantity)) {
    throw badRequest('Los premios entregados no pueden superar la cantidad total');
  }
}
