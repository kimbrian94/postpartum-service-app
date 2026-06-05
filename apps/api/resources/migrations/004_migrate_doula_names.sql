-- Migration: Migrate doula full_name to name_korean/name_english fields

-- Step 1: Add new columns
ALTER TABLE doulas ADD COLUMN IF NOT EXISTS name_korean VARCHAR(255);
ALTER TABLE doulas ADD COLUMN IF NOT EXISTS name_english VARCHAR(255);
ALTER TABLE doulas ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE doulas ADD COLUMN IF NOT EXISTS legal_status VARCHAR(100);
ALTER TABLE doulas ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE doulas ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE doulas ADD COLUMN IF NOT EXISTS vaccination_status VARCHAR(100);
ALTER TABLE doulas ADD COLUMN IF NOT EXISTS pet_allergies TEXT;

-- Step 2: Migrate existing full_name data to name_english
UPDATE doulas 
SET name_english = full_name 
WHERE full_name IS NOT NULL AND name_english IS NULL;

-- Step 3: Drop the old full_name column
ALTER TABLE doulas DROP COLUMN IF EXISTS full_name;

-- Step 4: Add constraint to ensure at least one name exists
ALTER TABLE doulas ADD CONSTRAINT at_least_one_name CHECK (name_korean IS NOT NULL OR name_english IS NOT NULL);

-- Step 5: Create indexes on new name columns
CREATE INDEX IF NOT EXISTS idx_doulas_name_korean ON doulas(name_korean);
CREATE INDEX IF NOT EXISTS idx_doulas_name_english ON doulas(name_english);

-- Add comments
COMMENT ON COLUMN doulas.name_korean IS 'Korean name of the doula';
COMMENT ON COLUMN doulas.name_english IS 'English name of the doula';
COMMENT ON COLUMN doulas.legal_status IS 'Legal work status (e.g., citizen, permanent_resident, work_permit)';
COMMENT ON COLUMN doulas.languages IS 'Comma-separated list of languages spoken';
COMMENT ON COLUMN doulas.vaccination_status IS 'Vaccination status (e.g., fully_vaccinated, partially_vaccinated, not_vaccinated)';
COMMENT ON COLUMN doulas.pet_allergies IS 'Description of any pet allergies';
