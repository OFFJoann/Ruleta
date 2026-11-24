import { db, nowIso } from '../config/db.js';

export interface ThemeSettings {
  clubName: string;
  logoUrl: string;
  backgroundUrl: string;
  backgroundVideoUrl: string;
  wheelBackgroundUrl: string;
  wheelCenterImageUrl: string;
  wheelCenterVideoUrl: string;
  wheelCenterPosterUrl: string;
  pointerColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  spinButtonText: string;
  spinSoundUrl: string;
  winSoundUrl: string;
  confettiEnabled: boolean;
  effectsEnabled: boolean;
  termsText: string;
  footerText: string;
  headline: string;
  subheadline: string;
}

export interface PromotionSettings {
  enabled: boolean;
  startsAt: string;
  endsAt: string;
  maxPerPhone: number;
  cooldownMinutes: number;
  finishedMessage: string;
}

export interface WhatsAppSettings {
  number: string;
  buttonText: string;
  message: string;
}

export type SettingsMap = {
  theme: ThemeSettings;
  promotion: PromotionSettings;
  whatsapp: WhatsAppSettings;
};

export const defaultSettings: SettingsMap = {
  theme: {
    clubName: 'NEON NIGHTS',
    logoUrl: '',
    backgroundUrl: '',
    backgroundVideoUrl: '',
    wheelBackgroundUrl: '',
    wheelCenterImageUrl: '',
    wheelCenterVideoUrl: '',
    wheelCenterPosterUrl: '',
    pointerColor: '#facc15',
    primaryColor: '#a855f7',
    secondaryColor: '#06b6d4',
    accentColor: '#ec4899',
    textColor: '#ffffff',
    fontFamily: 'Montserrat, system-ui, sans-serif',
    spinButtonText: 'GIRAR RULETA',
    spinSoundUrl: '',
    winSoundUrl: '',
    confettiEnabled: true,
    effectsEnabled: true,
    termsText: 'Participación gratuita. Los premios son personales e intransferibles. Válidos según condiciones indicadas en cada premio.',
    footerText: '© 2026 NEON NIGHTS · Todos los derechos reservados',
    headline: 'GIRA Y GANA',
    subheadline: 'Esta noche puede ser tu noche. ¡Tira la ruleta y reclama tu premio!',
  },
  promotion: {
    enabled: true,
    startsAt: '',
    endsAt: '',
    maxPerPhone: 3,
    cooldownMinutes: 60,
    finishedMessage: 'La promoción ha terminado. ¡Gracias por participar!',
  },
  whatsapp: {
    number: '573000000000',
    buttonText: 'RESERVAR POR WHATSAPP',
    message: 'Hola, acabo de participar en la ruleta de [CLUB] y gané [PREMIO]. Quiero realizar mi reserva. Mi código es [CODIGO].',
  },
};

export function getSetting<K extends keyof SettingsMap>(key: K): SettingsMap[K] {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  if (!row) return structuredClone(defaultSettings[key]);
  try {
    return { ...structuredClone(defaultSettings[key]), ...(JSON.parse(row.value) as object) } as SettingsMap[K];
  } catch {
    return structuredClone(defaultSettings[key]);
  }
}

export function setSetting<K extends keyof SettingsMap>(key: K, value: SettingsMap[K]): void {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, JSON.stringify(value), nowIso());
}

export function ensureDefaultSettings(): void {
  for (const key of Object.keys(defaultSettings) as Array<keyof SettingsMap>) {
    const exists = db.prepare('SELECT 1 FROM settings WHERE key = ?').get(key);
    if (!exists) setSetting(key, defaultSettings[key]);
  }
}
