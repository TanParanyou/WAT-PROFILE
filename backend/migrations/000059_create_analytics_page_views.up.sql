CREATE TABLE IF NOT EXISTS analytics_page_views (
    id BIGSERIAL PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    locale VARCHAR(10) NOT NULL DEFAULT 'th',
    resource_type VARCHAR(50) NOT NULL DEFAULT 'page',
    resource_id VARCHAR(100) DEFAULT '',
    ip_hash VARCHAR(64) NOT NULL DEFAULT '',
    device_type VARCHAR(20) NOT NULL DEFAULT 'desktop',
    browser VARCHAR(50) DEFAULT '',
    os VARCHAR(50) DEFAULT '',
    referrer TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_page_views_created_at ON analytics_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_resource ON analytics_page_views(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_path ON analytics_page_views(path);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_locale ON analytics_page_views(locale);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_ip_hash ON analytics_page_views(ip_hash);
