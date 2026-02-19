CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    title JSONB NOT NULL,
    description JSONB,
    event_date TIMESTAMPTZ NOT NULL,
    start_time TIME,
    end_time TIME,
    location JSONB,
    image_url VARCHAR(255),
    map_url TEXT,
    event_type VARCHAR(50),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern VARCHAR(50),
    max_participants INTEGER,
    registration_enabled BOOLEAN DEFAULT FALSE,
    registration_deadline TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);

CREATE TABLE IF NOT EXISTS event_schedules (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    time TIME NOT NULL,
    activity JSONB NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_schedules_event_id ON event_schedules(event_id);
