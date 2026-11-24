import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { env } from '../config/env.js';
import { authRequired } from '../common/auth.js';
import { badRequest, asyncHandler } from '../common/errors.js';

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, env.uploadDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    callback(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = [
      'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav',
      'audio/x-wav', 'audio/ogg', 'audio/mp4',
    ];
    if (!allowed.includes(file.mimetype)) {
      callback(new Error('Formato no permitido. Usa PNG, JPG, WEBP, GIF, MP4 o WEBM'));
      return;
    }
    callback(null, true);
  },
});

export const uploadRouter = Router();

uploadRouter.post(
  '/upload',
  authRequired,
  upload.single('file'),
  asyncHandler((req, res) => {
    if (!req.file) throw badRequest('No se recibió ningún archivo');
    res.status(201).json({
      url: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  }),
);
