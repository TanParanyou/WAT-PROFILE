CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    size BIGINT,
    url TEXT NOT NULL,
    path TEXT,
    uploaded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    alt_text VARCHAR(255),
    category VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by_id ON media(uploaded_by_id);
