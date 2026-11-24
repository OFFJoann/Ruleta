import { Router } from 'express';
import { getSetting, type SettingsMap } from '../common/settings.js';
import { getEligiblePrizes, toSegment } from '../modules/prizes/prizes.service.js';
import { asyncHandler } from '../common/errors.js';

export const publicRouter = Router();

publicRouter.get(
  '/wheel',
  asyncHandler((_req, res) => {
    const promotion = getSetting('promotion');
    const currentTime = Date.now();
    const notStarted = Boolean(promotion.startsAt && currentTime < new Date(promotion.startsAt).getTime());
    const finished =
      !promotion.enabled ||
      notStarted ||
      Boolean(promotion.endsAt && currentTime > new Date(promotion.endsAt).getTime());

    res.json({
      theme: getSetting('theme') satisfies SettingsMap['theme'],
      whatsapp: getSetting('whatsapp') satisfies SettingsMap['whatsapp'],
      promotion: {
        enabled: promotion.enabled && !notStarted && !finished,
        finished,
        startsAt: promotion.startsAt,
        endsAt: promotion.endsAt,
        maxPerPhone: promotion.maxPerPhone,
        finishedMessage: promotion.finishedMessage,
      },
      segments: getEligiblePrizes().map(toSegment),
      serverTime: new Date().toISOString(),
    });
  }),
);
