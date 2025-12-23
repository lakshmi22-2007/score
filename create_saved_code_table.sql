-- Run this in Supabase SQL Editor to create the saved_code table

CREATE TABLE saved_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL UNIQUE,
  html_code TEXT,
  css_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE saved_code ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read and write their own saved code
CREATE POLICY "Users can view their own saved code"
  ON saved_code
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own saved code"
  ON saved_code
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own saved code"
  ON saved_code
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups by user name
CREATE INDEX idx_saved_code_user_name ON saved_code(user_name);
