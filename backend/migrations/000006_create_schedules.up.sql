CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    schedule_type VARCHAR(20) NOT NULL,
    day_of_week INTEGER,
    time_start TIME,
    time_end TIME,
    activity JSONB NOT NULL,
    location JSONB,
    online_link TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_schedule_type ON schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_schedules_is_active ON schedules(is_active);
