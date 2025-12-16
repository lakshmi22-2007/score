export interface Score {
  id: string;
  player_name: string;
  score: number;
  game_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ScoreInput {
  player_name: string;
  score: number;
  game_name: string;
  [key: string]: unknown;
}
