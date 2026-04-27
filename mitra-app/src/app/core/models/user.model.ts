export interface AppUser {
  id: number;
  username: string;
  email: string;
  vorname: string;
  nachname: string;
  rolle: 'monteur' | 'buero' | 'admin';
  hero_partner_id?: string;   // HERO CRM Partner-ID (leer = kein CRM-Zugang)
  avatar_url?: string;
  push_subscription?: PushSubscriptionJSON | null;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
