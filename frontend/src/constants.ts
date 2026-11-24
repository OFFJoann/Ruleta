import type { Theme } from './types';

export const defaultTheme: Theme = {
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
  termsText: 'Participación gratuita.',
  footerText: '© 2026 NEON NIGHTS',
  headline: 'GIRA Y GANA',
  subheadline: 'Esta noche puede ser tu noche.',
};

export const statusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  reclamado: 'Reclamado',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
};

export const statusColors: Record<string, string> = {
  pendiente: 'bg-amber-400/15 text-amber-300 border-amber-400/25',
  reclamado: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/25',
  vencido: 'bg-white/10 text-white/50 border-white/15',
  cancelado: 'bg-red-400/15 text-red-300 border-red-400/25',
};
