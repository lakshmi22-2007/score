-- Add UPDATE policy for scores table
CREATE POLICY "Anyone can update scores"
  ON scores
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add unique constraint on player_name to prevent duplicates
-- First, remove duplicate entries keeping only the latest one
DELETE FROM scores a USING (
  SELECT MIN(created_at) as created_at, player_name 
  FROM scores 
  GROUP BY player_name 
  HAVING COUNT(*) > 1
) b
WHERE a.player_name = b.player_name 
AND a.created_at = b.created_at;

-- Now add the unique constraint
ALTER TABLE scores ADD CONSTRAINT unique_player_name UNIQUE (player_name);

-- Create index on player_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_scores_player_name ON scores(player_name);
