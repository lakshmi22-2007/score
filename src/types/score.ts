export interface Score {
  id: string;
  player_name: string;
  score: number;
  description: string;
  phone_no?: string;
  college?: string;
  html_code?: string;
  css_code?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface ScoreInput {
  player_name: string;
  score: number;
  description: string;
  [key: string]: unknown;
}
