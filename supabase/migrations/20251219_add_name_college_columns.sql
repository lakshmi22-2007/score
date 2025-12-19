-- Add name and college columns to scores table

ALTER TABLE scores 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS college text;

-- Create index for name and college
CREATE INDEX IF NOT EXISTS idx_scores_name ON scores(name);
CREATE INDEX IF NOT EXISTS idx_scores_college ON scores(college);
