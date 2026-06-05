-- Migration: Add assignment doula switch history
-- WARNING: This migration uses DROP TABLE which will delete existing assignment data.
-- Appointments/assignments are not live yet, so this keeps the DDL as full table creation.

DROP TABLE IF EXISTS assignment_doula_history CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;

CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    doula_id INTEGER NOT NULL REFERENCES doulas(id) ON DELETE RESTRICT,
    current_doula_id INTEGER NOT NULL REFERENCES doulas(id) ON DELETE RESTRICT,
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

CREATE TABLE assignment_doula_history (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    doula_id INTEGER NOT NULL REFERENCES doulas(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE,
    switch_reason TEXT,
    switch_category VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    CONSTRAINT valid_assignment_doula_history_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT switched_assignment_doula_history_requires_reason CHECK (
        switch_category IS NULL OR NULLIF(TRIM(switch_reason), '') IS NOT NULL
    ),
    CONSTRAINT valid_switch_category CHECK (
        switch_category IS NULL OR switch_category IN (
            'client_request',
            'doula_unavailable',
            'performance_issue',
            'mutual_agreement',
            'scheduling_conflict',
            'personality_mismatch',
            'language_barrier',
            'other'
        )
    )
);

CREATE INDEX idx_assignments_client_id ON assignments(client_id);
CREATE INDEX idx_assignments_doula_id ON assignments(doula_id);
CREATE INDEX idx_assignments_current_doula_id ON assignments(current_doula_id);
CREATE INDEX idx_assignments_start_date ON assignments(start_date);
CREATE INDEX idx_assignments_end_date ON assignments(end_date);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_date_range ON assignments(start_date, end_date);

CREATE INDEX idx_assignment_doula_history_assignment_id ON assignment_doula_history(assignment_id);
CREATE INDEX idx_assignment_doula_history_doula_id ON assignment_doula_history(doula_id);
CREATE INDEX idx_assignment_doula_history_dates ON assignment_doula_history(start_date, end_date);
CREATE UNIQUE INDEX idx_assignment_doula_history_one_active
    ON assignment_doula_history(assignment_id)
    WHERE end_date IS NULL;

COMMENT ON TABLE assignments IS 'Assignment of doulas to clients for specific service periods';
COMMENT ON COLUMN assignments.doula_id IS 'Compatibility pointer to the current doula; kept in sync with current_doula_id';
COMMENT ON COLUMN assignments.current_doula_id IS 'Current active doula for the assignment';
COMMENT ON COLUMN assignments.status IS 'Status values: in_progress, completed, cancelled';
COMMENT ON COLUMN assignments.service_type IS 'Service type: postpartum_care, massage, night_nurse, etc.';
COMMENT ON COLUMN assignments.cancellation_reason IS 'Reason for cancellation (only filled when status is cancelled)';

COMMENT ON TABLE assignment_doula_history IS 'Timeline of doulas assigned to an assignment, including switch reasons';
COMMENT ON COLUMN assignment_doula_history.end_date IS 'NULL indicates the currently active doula period for an in-progress assignment; completed assignments close on assignment.end_date, cancelled assignments close on the system cancellation date';
COMMENT ON COLUMN assignment_doula_history.switch_reason IS 'Required reason when a doula period ends because of a switch; not required for normal assignment completion';
COMMENT ON COLUMN assignment_doula_history.switch_category IS 'Category values: client_request, doula_unavailable, performance_issue, mutual_agreement, scheduling_conflict, personality_mismatch, language_barrier, other';
