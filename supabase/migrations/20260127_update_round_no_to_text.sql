-- Update round_no column to support string identifiers like '2001'
ALTER TABLE questions 
ALTER COLUMN round_no TYPE TEXT;

-- Update the comment
COMMENT ON COLUMN questions.round_no IS 'Round identifier (e.g., 2001, 2002, etc.)';
