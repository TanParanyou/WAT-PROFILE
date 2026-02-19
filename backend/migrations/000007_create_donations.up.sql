CREATE TABLE IF NOT EXISTS donation_categories (
    id SERIAL PRIMARY KEY,
    name JSONB NOT NULL,
    description JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    member_code VARCHAR(20) NOT NULL UNIQUE,
    first_name_th VARCHAR(100),
    last_name_th VARCHAR(100),
    first_name_en VARCHAR(100),
    last_name_en VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10),
    nationality VARCHAR(100),
    address_th TEXT,
    address_en TEXT,
    phone VARCHAR(20),
    line_id VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    membership_type VARCHAR(50) DEFAULT 'regular',
    membership_status VARCHAR(20) DEFAULT 'active',
    membership_date DATE DEFAULT CURRENT_DATE,
    profile_image_url VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_membership_status ON members(membership_status);

CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    donor_type VARCHAR(20) NOT NULL,
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    donor_name VARCHAR(255),
    donor_email VARCHAR(255),
    donor_phone VARCHAR(20),
    donor_address TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    donation_date DATE DEFAULT CURRENT_DATE,
    donation_method VARCHAR(50),
    category_id INTEGER REFERENCES donation_categories(id) ON DELETE SET NULL,
    purpose JSONB,
    is_anonymous BOOLEAN DEFAULT FALSE,
    tax_receipt_required BOOLEAN DEFAULT FALSE,
    tax_receipt_sent BOOLEAN DEFAULT FALSE,
    tax_receipt_sent_at TIMESTAMPTZ,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'confirmed',
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_member_id ON donations(member_id);
CREATE INDEX IF NOT EXISTS idx_donations_category_id ON donations(category_id);
CREATE INDEX IF NOT EXISTS idx_donations_donation_date ON donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
