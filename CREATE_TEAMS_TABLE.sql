-- =============================================================================
-- CREATE TEAMS TABLE IN SUPABASE
-- =============================================================================
-- Copy and paste this into Supabase SQL Editor and click RUN
-- =============================================================================

-- Create the teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name TEXT UNIQUE NOT NULL,
    college_name TEXT,
    phone_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_team_name ON teams(team_name);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow everyone to read teams (for admin view)
CREATE POLICY "Enable read access for all users" ON teams
    FOR SELECT
    USING (true);

-- Allow everyone to insert teams (for sign-in)
CREATE POLICY "Enable insert for all users" ON teams
    FOR INSERT
    WITH CHECK (true);

-- =============================================================================
-- Verify the table was created successfully
-- =============================================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'teams'
ORDER BY ordinal_position;
