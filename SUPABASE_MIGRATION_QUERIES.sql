-- =============================================================================
-- SUPABASE DATABASE MIGRATION QUERIES
-- =============================================================================
-- Run these SQL commands in your Supabase SQL Editor (Database > SQL Editor)
-- to create the new tables and update existing ones.
-- =============================================================================

-- 1. CREATE 'teams' TABLE
-- -----------------------------------------------------------------------------
-- This table stores team/user registration information including phone numbers
-- Used for sign-in and team tracking
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name TEXT UNIQUE NOT NULL,
    college_name TEXT,
    phone_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teams_team_name ON teams(team_name);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at DESC);

-- Enable Row Level Security (RLS) for teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies for teams table (adjust based on your auth requirements)
-- Allow all users to read teams
CREATE POLICY "Enable read access for all users" ON teams
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert teams
CREATE POLICY "Enable insert for authenticated users" ON teams
    FOR INSERT
    WITH CHECK (true);


-- 2. CREATE 'saved_code' TABLE
-- -----------------------------------------------------------------------------
-- This table stores code snapshots (HTML/CSS) for each user
-- Allows users to save their work and retrieve it later
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_code (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name TEXT NOT NULL UNIQUE,
    html_code TEXT,
    css_code TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_code_user_name ON saved_code(user_name);
CREATE INDEX IF NOT EXISTS idx_saved_code_updated_at ON saved_code(updated_at DESC);

-- Enable Row Level Security (RLS) for saved_code table
ALTER TABLE saved_code ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_code table
-- Allow all users to read saved codes (for admin view)
CREATE POLICY "Enable read access for all users" ON saved_code
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert/update their own saved code
CREATE POLICY "Enable insert for authenticated users" ON saved_code
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON saved_code
    FOR UPDATE
    USING (true);


-- 3. UPDATE 'scores' TABLE
-- -----------------------------------------------------------------------------
-- Add new columns to the existing scores table if they don't exist
-- This ensures backward compatibility with existing data
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- Add phone_no column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scores' AND column_name = 'phone_no'
    ) THEN
        ALTER TABLE scores ADD COLUMN phone_no TEXT;
    END IF;

    -- Add college column (if not already exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scores' AND column_name = 'college'
    ) THEN
        ALTER TABLE scores ADD COLUMN college TEXT;
    END IF;

    -- Add html_code column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scores' AND column_name = 'html_code'
    ) THEN
        ALTER TABLE scores ADD COLUMN html_code TEXT;
    END IF;

    -- Add css_code column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scores' AND column_name = 'css_code'
    ) THEN
        ALTER TABLE scores ADD COLUMN css_code TEXT;
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scores' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE scores ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_scores_phone_no ON scores(phone_no);
CREATE INDEX IF NOT EXISTS idx_scores_college ON scores(college);
CREATE INDEX IF NOT EXISTS idx_scores_updated_at ON scores(updated_at DESC);


-- 4. CREATE TRIGGER TO AUTO-UPDATE 'updated_at' TIMESTAMP
-- -----------------------------------------------------------------------------
-- This trigger automatically updates the updated_at column when a row is modified
-- -----------------------------------------------------------------------------

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to scores table
DROP TRIGGER IF EXISTS update_scores_updated_at ON scores;
CREATE TRIGGER update_scores_updated_at
    BEFORE UPDATE ON scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to saved_code table
DROP TRIGGER IF EXISTS update_saved_code_updated_at ON saved_code;
CREATE TRIGGER update_saved_code_updated_at
    BEFORE UPDATE ON saved_code
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these queries to verify that the tables were created successfully
-- =============================================================================

-- Check if teams table exists and view structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'teams'
ORDER BY ordinal_position;

-- Check if saved_code table exists and view structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'saved_code'
ORDER BY ordinal_position;

-- Check updated scores table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'scores'
ORDER BY ordinal_position;

-- Count rows in each table
SELECT 'teams' as table_name, COUNT(*) as row_count FROM teams
UNION ALL
SELECT 'saved_code', COUNT(*) FROM saved_code
UNION ALL
SELECT 'scores', COUNT(*) FROM scores;


-- =============================================================================
-- OPTIONAL: SAMPLE DATA FOR TESTING
-- =============================================================================
-- Uncomment and run these queries to insert sample data for testing
-- =============================================================================

/*
-- Insert sample team
INSERT INTO teams (team_name, college_name, phone_no)
VALUES ('Sample Team', 'Sample College', '1234567890')
ON CONFLICT (team_name) DO NOTHING;

-- Insert sample saved code
INSERT INTO saved_code (user_name, html_code, css_code)
VALUES (
    'Sample User',
    '<h1>Hello World</h1><p>This is a test</p>',
    'h1 { color: blue; } p { color: green; }'
)
ON CONFLICT (user_name) DO UPDATE 
SET html_code = EXCLUDED.html_code, css_code = EXCLUDED.css_code;
*/


-- =============================================================================
-- NOTES AND RECOMMENDATIONS
-- =============================================================================
-- 1. Make sure to adjust RLS (Row Level Security) policies based on your 
--    authentication requirements
-- 2. Consider adding foreign key constraints if you need to link teams to scores
-- 3. Monitor index performance and add/remove indexes as needed
-- 4. Regular backups are recommended before running migration scripts
-- 5. Test these queries in a development environment first
-- =============================================================================
