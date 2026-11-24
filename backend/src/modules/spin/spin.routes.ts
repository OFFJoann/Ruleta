import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { spinSchema } from '../../common/schemas.js';
import { asyncHandler } from '../../common/errors.js';
import { logAudit } from '../../common/audit.js';
import { env } from '../../config/env.js';
import { performSpin } from './spin.service.js';

export const spinRouter = Router();

const spinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.spinRateLimit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos, espera unos minutos' } },
});

spinRouter.post(
  '/spin',
  spinLimiter,
  asyncHandler((req, res) => {
    const input = spinSchema.parse(req.body);
    const result = performSpin(input);
    logAudit(null, 'GIRO', 'participacion', result.participation.code, `Premio: ${result.participation.prizeName}`, req.ip);
    res.json(result);
  }),
);
