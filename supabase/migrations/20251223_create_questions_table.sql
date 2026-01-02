-- Create questions table to store round challenges
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_no INTEGER NOT NULL UNIQUE,
  html_code TEXT NOT NULL,
  css_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read questions
CREATE POLICY "Anyone can view questions"
  ON questions
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert/update questions (for admin)
CREATE POLICY "Authenticated users can insert questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups by round number
CREATE INDEX idx_questions_round_no ON questions(round_no);
