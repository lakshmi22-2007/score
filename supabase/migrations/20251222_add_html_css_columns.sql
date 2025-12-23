-- Add HTML and CSS columns to scores table to store code submissions

ALTER TABLE scores 
ADD COLUMN IF NOT EXISTS html_code text,
ADD COLUMN IF NOT EXISTS css_code text;

-- Add comments to document the columns
COMMENT ON COLUMN scores.html_code IS 'HTML code submitted by the user';
COMMENT ON COLUMN scores.css_code IS 'CSS code submitted by the user';
