import { randomBytes, randomInt } from 'node:crypto';
import { db, nowIso, withTransaction } from '../../config/db.js';
import { conflict, forbidden, tooMany } from '../../common/errors.js';
import { getSetting } from '../../common/settings.js';
import { getEligiblePrizes, toSegment, type Prize, type PrizeSegment } from '../prizes/prizes.service.js';
import type { SpinInput } from '../../common/schemas.js';

const CODE_SCALE = 1_000_000;

export interface SpinResponse {
  segments: PrizeSegment[];
  winningIndex: number;
  participation: {
    id: number;
    uid: string;
    name: string;
    phone: string;
    code: string;
    prizeId: number;
    prizeName: string;
    status: string;
    createdAt: string;
  };
  result: {
    title: string;
    message: string;
    description: string;
    imageUrl: string;
    instructions: string;
    expiresAt: string;
    terms: string;
    whatsapp: {
      number: string;
      buttonText: string;
      message: string;
      url: string;
    };
  };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\[(CLUB|PREMIO|CODIGO|NOMBRE)\]/g, (_match, key: string) => values[key] ?? '');
}

function generateCode(): string {
  return `RULETA-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

function createParticipation(
  input: SpinInput,
  phone: string,
  prize: Prize,
  theme: ReturnType<typeof getSetting<'theme'>>,
  whatsapp: ReturnType<typeof getSetting<'whatsapp'>>,
): { id: number; uid: string; code: string; createdAt: string } {
  const uid = randomBytes(16).toString('hex');
  const createdAt = nowIso();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateCode();
    try {
      const result = db
        .prepare(
          `INSERT INTO participations
           (participation_uid, name, phone, prize_id, prize_name_snapshot, prize_icon_snapshot,
            code, status, result_message_snapshot, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)`,
        )
        .run(
          uid,
          input.name,
          phone,
          prize.id,
          prize.name,
          prize.icon,
          code,
          prize.result_message,
          createdAt,
        );
      return { id: Number(result.lastInsertRowid), uid, code, createdAt };
    } catch (error) {
      if (String(error).includes('UNIQUE constraint failed: participations.code')) continue;
      throw error;
    }
  }
  throw conflict('No se pudo generar un código único, intenta nuevamente');
}

export function performSpin(input: SpinInput): SpinResponse {
  return withTransaction(() => {
    const promotion = getSetting('promotion');
    const currentTime = Date.now();

    if (!promotion.enabled) throw forbidden('La ruleta está desactivada temporalmente');
    if (promotion.startsAt && currentTime < new Date(promotion.startsAt).getTime()) {
      throw forbidden('La promoción aún no ha comenzado');
    }
    if (promotion.endsAt && currentTime > new Date(promotion.endsAt).getTime()) {
      throw forbidden(promotion.finishedMessage || 'La promoción ha terminado');
    }

    const phone = normalizePhone(input.phone);
    const history = db
      .prepare('SELECT COUNT(*) AS count, MAX(created_at) AS last_at FROM participations WHERE phone = ?')
      .get(phone) as { count: number; last_at: string | null };

    if (history.count >= promotion.maxPerPhone) {
      throw tooMany(`Alcanzaste el máximo de ${promotion.maxPerPhone} participaciones permitidas`);
    }
    if (history.last_at) {
      const elapsed = currentTime - new Date(history.last_at).getTime();
      if (elapsed < promotion.cooldownMinutes * 60_000) {
        const minutes = Math.ceil((promotion.cooldownMinutes * 60_000 - elapsed) / 60_000);
        throw tooMany(`Debes esperar ${minutes} minuto(s) antes de volver a participar`);
      }
    }

    const eligible = getEligiblePrizes();
    if (eligible.length === 0) throw conflict('No hay premios disponibles en este momento');

    const weights = eligible.map((prize) => Math.round(Math.max(0, prize.probability) * CODE_SCALE));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight <= 0) throw conflict('Las probabilidades de los premios no están configuradas');

    let ticket = randomInt(totalWeight);
    let winningIndex = 0;
    for (let index = 0; index < weights.length; index += 1) {
      if (ticket < weights[index]) {
        winningIndex = index;
        break;
      }
      ticket -= weights[index];
    }
    const winner = eligible[winningIndex];

    const theme = getSetting('theme');
    const whatsapp = getSetting('whatsapp');
    const participation = createParticipation(input, phone, winner, theme, whatsapp);

    if (!winner.is_unlimited) {
      const updated = db
        .prepare(
          'UPDATE prizes SET delivered = delivered + 1, updated_at = ? WHERE id = ? AND delivered < quantity',
        )
        .run(nowIso(), winner.id);
      if (updated.changes !== 1) throw conflict('El premio se agotó durante el giro. Intenta nuevamente.');
    }

    const values = {
      CLUB: theme.clubName,
      PREMIO: winner.name,
      CODIGO: participation.code,
      NOMBRE: input.name,
    };
    const waMessage = fillTemplate(
      winner.whatsapp_message || whatsapp.message,
      values,
    );
    const waNumber = (winner.whatsapp_number || whatsapp.number).replace(/[^\d]/g, '');

    return {
      segments: eligible.map(toSegment),
      winningIndex,
      participation: {
        id: participation.id,
        uid: participation.uid,
        name: input.name,
        phone,
        code: participation.code,
        prizeId: winner.id,
        prizeName: winner.name,
        status: 'pendiente',
        createdAt: participation.createdAt,
      },
      result: {
        title: winner.result_title || '¡FELICIDADES!',
        message:
          winner.result_message ||
          `¡Ganaste ${winner.name}! Pasa por la discoteca para reclamar tu premio.`,
        description: winner.result_description,
        imageUrl: winner.celebration_image_url || winner.image_url,
        instructions: winner.claim_instructions,
        expiresAt: winner.expires_at,
        terms: winner.terms || theme.termsText,
        whatsapp: {
          number: waNumber,
          buttonText: winner.whatsapp_button_text || whatsapp.buttonText,
          message: waMessage,
          url: `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`,
        },
      },
    };
  });
}
