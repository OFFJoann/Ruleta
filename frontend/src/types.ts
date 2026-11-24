export interface Segment {
  id: number;
  name: string;
  icon: string;
  color: string;
  imageUrl: string;
  description: string;
  isConsolation: boolean;
}

export interface Theme {
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

export interface PromotionState {
  enabled: boolean;
  finished: boolean;
  startsAt: string;
  endsAt: string;
  maxPerPhone: number;
  finishedMessage: string;
}

export interface WhatsAppConfig {
  number: string;
  buttonText: string;
  message: string;
}

export interface WheelData {
  theme: Theme;
  whatsapp: WhatsAppConfig;
  promotion: PromotionState;
  segments: Segment[];
  serverTime: string;
}

export interface SpinResult {
  segments: Segment[];
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

export interface Prize {
  id: number;
  name: string;
  description: string;
  image_url: string;
  icon: string;
  color: string;
  probability: number;
  quantity: number;
  is_unlimited: boolean;
  is_consolation: boolean;
  delivered: number;
  active: boolean;
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
  effectiveProbability: number;
  available: boolean;
}

export interface Stats {
  total: number;
  delivered: number;
  available: number;
  exhausted: number;
  courtesies: number;
  discounts: number;
  today: number;
  recent: Array<{
    name: string;
    phone: string;
    prize_name_snapshot: string;
    code: string;
    status: string;
    created_at: string;
  }>;
  byPrize: Array<{
    id: number;
    name: string;
    icon: string;
    color: string;
    original_probability: number;
    quantity: number;
    delivered: number;
    participations: number;
  }>;
}

export interface AuditRow {
  id: number;
  admin_id: number | null;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  ip: string;
  created_at: string;
  username: string | null;
}
