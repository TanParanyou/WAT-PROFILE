CREATE TABLE IF NOT EXISTS gallery_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name JSONB NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_categories_is_active ON gallery_categories(is_active);

CREATE TABLE IF NOT EXISTS galleries (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    caption JSONB,
    category_id INTEGER REFERENCES gallery_categories(id) ON DELETE SET NULL,
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_galleries_category_id ON galleries(category_id);
CREATE INDEX IF NOT EXISTS idx_galleries_event_id ON galleries(event_id);
CREATE INDEX IF NOT EXISTS idx_galleries_is_active ON galleries(is_active);
