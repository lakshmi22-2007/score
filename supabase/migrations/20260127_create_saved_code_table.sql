-- Create saved_code table to store user code drafts
CREATE TABLE IF NOT EXISTS saved_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  html_code TEXT,
  css_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE saved_code ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read their own saved code
CREATE POLICY "Anyone can view saved_code"
  ON saved_code
  FOR SELECT
  TO public
  USING (true);

-- Allow anyone to insert saved code
CREATE POLICY "Anyone can insert saved_code"
  ON saved_code
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to update saved code
CREATE POLICY "Anyone can update saved_code"
  ON saved_code
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create index on user_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_code_user_name ON saved_code(user_name);
CREATE INDEX IF NOT EXISTS idx_saved_code_updated_at ON saved_code(updated_at DESC);

-- Add unique constraint to allow only one saved code per user
ALTER TABLE saved_code ADD CONSTRAINT unique_user_saved_code UNIQUE (user_name);
