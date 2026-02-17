CREATE TABLE IF NOT EXISTS monks (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    name JSONB NOT NULL,
    title JSONB,
    bio JSONB,
    ordination_date DATE,
    position VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_monks_slug ON monks(slug);
CREATE INDEX IF NOT EXISTS idx_monks_is_active ON monks(is_active);
