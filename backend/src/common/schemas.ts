import { z } from 'zod';

export const spinSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa tu nombre').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s()-]{7,20}$/, 'Ingresa un número de WhatsApp válido'),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar los términos' }) }),
});

export type SpinInput = z.infer<typeof spinSchema>;

const optionalUrl = z.string().max(2000).optional().default('');
const boolLike = z.union([z.boolean(), z.coerce.number().min(0).max(1)]).optional().default(false);

export const prizeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).optional().default(''),
  image_url: optionalUrl,
  icon: z.string().max(20).optional().default('🎉'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hexadecimal inválido').optional().default('#8b5cf6'),
  probability: z.coerce.number().min(0).max(100),
  quantity: z.coerce.number().int().min(0),
  is_unlimited: boolLike,
  delivered: z.coerce.number().int().min(0).optional().default(0),
  active: boolLike,
  is_consolation: boolLike,
  position: z.coerce.number().int().min(0).optional().default(0),
  result_title: z.string().max(200).optional().default(''),
  result_message: z.string().max(2000).optional().default(''),
  result_description: z.string().max(2000).optional().default(''),
  celebration_image_url: optionalUrl,
  claim_instructions: z.string().max(2000).optional().default(''),
  expires_at: z.string().max(50).optional().default(''),
  terms: z.string().max(2000).optional().default(''),
  whatsapp_button_text: z.string().max(100).optional().default('RESERVAR POR WHATSAPP'),
  whatsapp_number: z.string().max(30).optional().default(''),
  whatsapp_message: z.string().max(2000).optional().default(''),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const codeSchema = z.object({
  code: z.string().trim().min(5).max(60),
});

export const statusSchema = z.enum(['pendiente', 'reclamado', 'vencido', 'cancelado']);
