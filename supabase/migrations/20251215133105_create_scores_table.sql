/*
  # Create Scores Table

  1. New Tables
    - `scores`
      - `id` (uuid, primary key) - Unique identifier for each score entry
      - `player_name` (text) - Name of the player
      - `score` (integer) - Numeric score value
      - `game_name` (text) - Name of the game or category
      - `metadata` (jsonb) - Additional data from the JSON input
      - `created_at` (timestamptz) - Timestamp when the score was recorded

  2. Security
    - Enable RLS on `scores` table
    - Add policy for anyone to read scores (public leaderboard)
    - Add policy for anyone to insert scores (open submission)

  3. Indexes
    - Create index on score for efficient sorting
    - Create index on created_at for time-based queries
*/

CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  game_name text NOT NULL DEFAULT 'default',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scores"
  ON scores
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert scores"
  ON scores
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_game_name ON scores(game_name);