-- Migration: Add denormalized intake fields to clients table

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS is_twins BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS postpartum_care_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS postpartum_care_days_per_week INTEGER,
ADD COLUMN IF NOT EXISTS postpartum_care_weeks INTEGER,
ADD COLUMN IF NOT EXISTS special_massage_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS special_massage_sessions INTEGER,
ADD COLUMN IF NOT EXISTS facial_massage_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS facial_massage_sessions INTEGER,
ADD COLUMN IF NOT EXISTS rmt_massage_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS night_nurse_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS night_nurse_weeks INTEGER;

-- Indexes for querying intake data
CREATE INDEX IF NOT EXISTS idx_clients_postpartum_care ON clients(postpartum_care_requested) WHERE postpartum_care_requested = TRUE;

-- Add comment documenting denormalized fields
COMMENT ON TABLE clients IS 'Denormalized intake fields present for testing; will normalize later to client_services.';
