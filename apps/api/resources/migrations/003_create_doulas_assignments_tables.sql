-- Migration: Create doulas and assignments tables for calendar scheduling system

-- Doulas table - care providers who can be assigned to clients
CREATE TABLE IF NOT EXISTS doulas (
    id SERIAL PRIMARY KEY,
    name_korean VARCHAR(255),
    name_english VARCHAR(255),
    date_of_birth DATE NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    legal_status VARCHAR(100) NOT NULL,
    languages TEXT,
    start_year INTEGER,
    has_tdap BOOLEAN DEFAULT FALSE NOT NULL,
    has_mmr BOOLEAN DEFAULT FALSE NOT NULL,
    has_varicella BOOLEAN DEFAULT FALSE NOT NULL,
    has_hep_b BOOLEAN DEFAULT FALSE NOT NULL,
    vaccination_status VARCHAR(100) GENERATED ALWAYS AS (
        CASE 
            WHEN has_tdap AND has_mmr AND has_varicella AND has_hep_b THEN 'fully_vaccinated'
            WHEN has_tdap OR has_mmr OR has_varicella OR has_hep_b THEN 'partially_vaccinated'
            ELSE 'not_vaccinated'
        END
    ) STORED,
    pet_allergies TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT at_least_one_name CHECK (name_korean IS NOT NULL OR name_english IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_doulas_name_korean ON doulas(name_korean);
CREATE INDEX IF NOT EXISTS idx_doulas_name_english ON doulas(name_english);
CREATE INDEX IF NOT EXISTS idx_doulas_email ON doulas(email);
CREATE INDEX IF NOT EXISTS idx_doulas_is_active ON doulas(is_active);

COMMENT ON TABLE doulas IS 'Care providers (doulas) who can be assigned to clients for postpartum care and other services';
COMMENT ON COLUMN doulas.name_korean IS 'Korean name of the doula';
COMMENT ON COLUMN doulas.name_english IS 'English name of the doula';
COMMENT ON COLUMN doulas.legal_status IS 'Legal work status (e.g., citizen, permanent_resident, work_permit)';
COMMENT ON COLUMN doulas.languages IS 'Comma-separated list of languages spoken';
COMMENT ON COLUMN doulas.has_tdap IS 'Tdap (Tetanus, Diphtheria, Pertussis) vaccination status';
COMMENT ON COLUMN doulas.has_mmr IS 'MMR (Measles, Mumps, Rubella) vaccination status';
COMMENT ON COLUMN doulas.has_varicella IS 'Varicella (Chickenpox) vaccination status';
COMMENT ON COLUMN doulas.has_hep_b IS 'Hepatitis B vaccination status';
COMMENT ON COLUMN doulas.vaccination_status IS 'Computed vaccination status based on individual vaccines (fully_vaccinated, partially_vaccinated, not_vaccinated)';
COMMENT ON COLUMN doulas.pet_allergies IS 'Description of any pet allergies';

-- Assignments table - links clients to doulas for specific service periods
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    doula_id INTEGER NOT NULL REFERENCES doulas(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    service_type VARCHAR(100) NOT NULL DEFAULT 'postpartum_care',
    days_per_week INTEGER,
    total_weeks INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_start_date_not_sunday CHECK (EXTRACT(DOW FROM start_date) BETWEEN 1 AND 6)
);

CREATE INDEX IF NOT EXISTS idx_assignments_client_id ON assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_assignments_doula_id ON assignments(doula_id);
CREATE INDEX IF NOT EXISTS idx_assignments_start_date ON assignments(start_date);
CREATE INDEX IF NOT EXISTS idx_assignments_end_date ON assignments(end_date);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_date_range ON assignments(start_date, end_date);

COMMENT ON TABLE assignments IS 'Assignment of doulas to clients for specific service periods';
COMMENT ON COLUMN assignments.status IS 'Status values: in_progress, completed, cancelled';
COMMENT ON COLUMN assignments.service_type IS 'Service type: postpartum_care, massage, night_nurse, etc.';
