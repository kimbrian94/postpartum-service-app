-- Clients table - Core client information
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    
    -- Basic Contact Info
    email VARCHAR(255) NOT NULL,
    name_korean VARCHAR(255),
    name_english VARCHAR(255),
    phone_number VARCHAR(50),
    
    -- Address Info
    residential_area VARCHAR(255),
    home_address TEXT,
    visitor_parking_available BOOLEAN DEFAULT FALSE,
    
    -- Pregnancy Info
    due_date DATE NOT NULL,
    actual_delivery_date DATE,
    pregnancy_number INTEGER,
    is_twins BOOLEAN DEFAULT FALSE,
    
    -- Household Info
    has_pets BOOLEAN DEFAULT FALSE,
    other_household_members TEXT,
    cultural_background VARCHAR(255),
    
    -- Food Preferences
    familiar_with_korean_food BOOLEAN DEFAULT TRUE,
    preferred_cuisine TEXT,
    
    -- Contact & Referral Info
    contact_platform VARCHAR(100), -- 'KakaoTalk', 'Instagram', 'Email', 'Phone'
    platform_username VARCHAR(255),
    referral_source VARCHAR(255), -- 'Friend', 'Family', 'Instagram', 'Google'
    referrer_name VARCHAR(255),
    preferred_language VARCHAR(50), -- 'Korean', 'English'
    
    -- Service Requests from Intake Form (denormalized for testing)
    postpartum_care_requested BOOLEAN DEFAULT FALSE,
    postpartum_care_days_per_week INTEGER,
    postpartum_care_weeks INTEGER,
    
    special_massage_requested BOOLEAN DEFAULT FALSE,
    special_massage_sessions INTEGER,
    
    facial_massage_requested BOOLEAN DEFAULT FALSE,
    facial_massage_sessions INTEGER,
    
    rmt_massage_requested BOOLEAN DEFAULT FALSE,
    
    night_nurse_requested BOOLEAN DEFAULT FALSE,
    night_nurse_weeks INTEGER,
    
    -- Admin Fields
    internal_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_deposit', 
    -- Status values: pending_deposit, deposit_received, full_payment_received, 
    --                service_in_progress, service_completed, cancelled
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Services/Products table - Types of services offered
CREATE TABLE service_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_korean VARCHAR(255),
    description TEXT,
    base_price DECIMAL(10, 2),
    unit VARCHAR(50), -- 'days', 'weeks', 'sessions'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Client Services - Services booked by each client
CREATE TABLE client_services (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_type_id INTEGER NOT NULL REFERENCES service_types(id),
    duration_value INTEGER, -- number of days/weeks
    duration_unit VARCHAR(50), -- 'days', 'weeks'
    massage_type VARCHAR(255),
    special_massage_sessions INTEGER DEFAULT 0,
    facial_massage_sessions INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    assigned_doula_id INTEGER REFERENCES doulas(id),
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Doulas table - Service providers
CREATE TABLE doulas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_korean VARCHAR(255),
    phone_number VARCHAR(50),
    email VARCHAR(255),
    specialties TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Appointments/Calendar entries - Daily service schedule
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client_service_id INTEGER NOT NULL REFERENCES client_services(id) ON DELETE CASCADE,
    doula_id INTEGER NOT NULL REFERENCES doulas(id),
    appointment_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    service_type VARCHAR(100), -- 'postpartum_care', 'massage', 'facial', 'night_nurse'
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    deposit_amount DECIMAL(10, 2) DEFAULT 0,
    remaining_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, sent, deposit_paid, fully_paid, overdue, cancelled
    payment_method VARCHAR(50),
    notes TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Line Items
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_service_id INTEGER REFERENCES client_services(id),
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_type VARCHAR(50), -- 'deposit', 'full_payment', 'partial_payment'
    transaction_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payment Reminders
CREATE TABLE payment_reminders (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50), -- 'deposit_due', 'payment_due', 'overdue'
    scheduled_date DATE NOT NULL,
    sent_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, cancelled
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Status Change History - Audit trail
CREATE TABLE status_history (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'client', 'invoice', 'service'
    entity_id INTEGER NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_due_date ON clients(due_date);
CREATE INDEX idx_client_services_client_id ON client_services(client_id);
CREATE INDEX idx_client_services_doula_id ON client_services(assigned_doula_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_doula_id ON appointments(doula_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);