-- Migration: Add service_area field to doulas table
-- WARNING: This migration uses DROP TABLE which will delete all existing doula and assignment data
-- If you have production data, export it first and re-import after migration

-- Drop assignments table first (has foreign key to doulas)
DROP TABLE IF EXISTS assignments CASCADE;

-- Drop doulas table
DROP TABLE IF EXISTS doulas CASCADE;

-- Recreate doulas table with service_area field
CREATE TABLE doulas (
    id SERIAL PRIMARY KEY,
    name_korean VARCHAR(255),
    name_english VARCHAR(255),
    date_of_birth DATE NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    legal_status VARCHAR(100) NOT NULL,
    languages TEXT,
    service_area TEXT,
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

-- Recreate indexes
CREATE INDEX idx_doulas_name_korean ON doulas(name_korean);
CREATE INDEX idx_doulas_name_english ON doulas(name_english);
CREATE INDEX idx_doulas_email ON doulas(email);
CREATE INDEX idx_doulas_is_active ON doulas(is_active);

-- Add table and column comments
COMMENT ON TABLE doulas IS 'Care providers (doulas) who can be assigned to clients for postpartum care and other services';
COMMENT ON COLUMN doulas.name_korean IS 'Korean name of the doula';
COMMENT ON COLUMN doulas.name_english IS 'English name of the doula';
COMMENT ON COLUMN doulas.legal_status IS 'Legal work status (e.g., citizen, permanent_resident, work_permit)';
COMMENT ON COLUMN doulas.languages IS 'Comma-separated list of languages spoken';
COMMENT ON COLUMN doulas.service_area IS 'Comma-separated list of service areas (Ajax, Aurora/ King City, Barrie, etc.) or "All Areas"';
COMMENT ON COLUMN doulas.has_tdap IS 'Tdap (Tetanus, Diphtheria, Pertussis) vaccination status';
COMMENT ON COLUMN doulas.has_mmr IS 'MMR (Measles, Mumps, Rubella) vaccination status';
COMMENT ON COLUMN doulas.has_varicella IS 'Varicella (Chickenpox) vaccination status';
COMMENT ON COLUMN doulas.has_hep_b IS 'Hepatitis B vaccination status';
COMMENT ON COLUMN doulas.vaccination_status IS 'Computed vaccination status based on individual vaccines (fully_vaccinated, partially_vaccinated, not_vaccinated)';
COMMENT ON COLUMN doulas.pet_allergies IS 'Description of any pet allergies';

-- Recreate assignments table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    doula_id INTEGER NOT NULL REFERENCES doulas(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    service_type VARCHAR(100) NOT NULL DEFAULT 'postpartum_care',
    days_per_week INTEGER,
    total_weeks INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_start_date_not_sunday CHECK (EXTRACT(DOW FROM start_date) BETWEEN 1 AND 6)
);

-- Recreate assignment indexes
CREATE INDEX idx_assignments_client_id ON assignments(client_id);
CREATE INDEX idx_assignments_doula_id ON assignments(doula_id);
CREATE INDEX idx_assignments_start_date ON assignments(start_date);
CREATE INDEX idx_assignments_end_date ON assignments(end_date);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_date_range ON assignments(start_date, end_date);

-- Add assignment comments
COMMENT ON TABLE assignments IS 'Assignment of doulas to clients for specific service periods';
COMMENT ON COLUMN assignments.status IS 'Status values: in_progress, completed, cancelled';
COMMENT ON COLUMN assignments.service_type IS 'Service type: postpartum_care, massage, night_nurse, etc.';
COMMENT ON COLUMN assignments.cancellation_reason IS 'Reason for cancellation (only filled when status is cancelled)';

-- Sample doula records with various service areas
INSERT INTO doulas (name_korean, name_english, date_of_birth, phone_number, email, legal_status, languages, service_area, start_year, has_tdap, has_mmr, has_varicella, has_hep_b, pet_allergies, is_active, notes) VALUES
-- Doula covering all areas
('김미소', 'Miso Kim', '1985-03-15', '416-555-0101', 'miso.kim@example.com', 'citizen', 'Korean, English', 'All Areas', 2015, TRUE, TRUE, TRUE, TRUE, NULL, TRUE, 'Experienced doula with 10+ years, specializes in postpartum care'),

-- Doulas covering specific areas
('이수진', 'Sujin Lee', '1990-07-22', '647-555-0102', 'sujin.lee@example.com', 'permanent_resident', 'Korean, English, Mandarin', 'Downtown, Midtown, North York/ Thornhill', 2018, TRUE, TRUE, TRUE, FALSE, 'Cats', TRUE, 'Specializes in night nurse services'),

('박민정', 'Minjung Park', '1988-11-05', '416-555-0103', 'minjung.park@example.com', 'citizen', 'Korean, English', 'Mississauga, Oakville, Milton', 2016, TRUE, TRUE, FALSE, TRUE, NULL, TRUE, 'Expert in traditional Korean postpartum care (산후조리)'),

('최영희', 'Younghee Choi', '1982-05-18', '905-555-0104', 'younghee.choi@example.com', 'permanent_resident', 'Korean, English, Japanese', 'Markham/ Scarborough, Richmond Hill, Vaughan', 2012, TRUE, TRUE, TRUE, TRUE, 'Dogs', TRUE, 'Certified massage therapist'),

('정은지', 'Eunji Jung', '1992-09-30', '647-555-0105', 'eunji.jung@example.com', 'work_permit', 'Korean, English', 'Brampton, Vaughan, Etobicoke', 2020, TRUE, FALSE, TRUE, TRUE, NULL, TRUE, 'Recently certified, enthusiastic and caring'),

('한소라', 'Sora Han', '1987-02-14', '416-555-0106', 'sora.han@example.com', 'citizen', 'Korean, English, Spanish', 'Ajax, Aurora/ King City, Barrie', 2017, TRUE, TRUE, TRUE, TRUE, NULL, TRUE, 'Bilingual services available'),

('윤지아', 'Jia Yoon', '1995-12-08', '905-555-0107', 'jia.yoon@example.com', 'permanent_resident', 'Korean, English', 'Hamilton, Niagara', 2021, FALSE, TRUE, TRUE, TRUE, 'Both cats and dogs', TRUE, 'Focus on maternal mental health support'),

('강하늘', 'Haneul Kang', '1983-08-25', '647-555-0108', 'haneul.kang@example.com', 'citizen', 'Korean, English', 'Newmarket, Aurora/ King City, Richmond Hill', 2014, TRUE, TRUE, TRUE, TRUE, NULL, TRUE, 'Specializes in twin care'),

('서민아', 'Mina Seo', '1989-04-12', '416-555-0109', 'mina.seo@example.com', 'permanent_resident', 'Korean, English, French', 'Downtown, Etobicoke, Mississauga', 2019, TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Certified lactation consultant'),

('조하윤', 'Hayoon Cho', '1986-10-20', '905-555-0110', 'hayoon.cho@example.com', 'citizen', 'Korean, English', 'Oakville, Mississauga, Milton', 2015, TRUE, TRUE, TRUE, TRUE, NULL, FALSE, 'Currently on leave');

