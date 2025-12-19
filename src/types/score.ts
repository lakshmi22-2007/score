export interface Score {
  id: string;
  player_name: string;
  score: number;
  description: string;
  name?: string;
  college?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ScoreInput {
  player_name: string;
  score: number;
  description: string;
  [key: string]: unknown;
}
