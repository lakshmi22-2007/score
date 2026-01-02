-- Run this in Supabase SQL Editor to create the questions table

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roundno INTEGER NOT NULL UNIQUE,
  htmlcode TEXT NOT NULL,
  csscode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read questions
CREATE POLICY "Anyone can view questions"
  ON questions
  FOR SELECT
  TO public
  USING (true);

-- Sample data for Round 1
INSERT INTO questions (roundno, htmlcode, csscode) 
VALUES (
  1, 
  '<h1>Welcome to Round 1</h1><p>Create a simple webpage with a heading, paragraph, and a button that shows an alert when clicked.</p><button onclick="alert(''Hello!'')">Click Me</button>',
  'body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: Arial, sans-serif; } h1 { font-size: 2.5rem; margin-bottom: 1rem; } p { font-size: 1.2rem; margin-bottom: 2rem; } button { padding: 12px 24px; font-size: 1rem; background: white; color: #667eea; border: none; border-radius: 8px; cursor: pointer; transition: transform 0.2s; } button:hover { transform: scale(1.05); }'
);
