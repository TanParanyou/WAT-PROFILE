-- Create news_categories table
CREATE TABLE IF NOT EXISTS news_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name JSONB NOT NULL,
    description JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_categories_slug ON news_categories(slug);
CREATE INDEX IF NOT EXISTS idx_news_categories_is_active ON news_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_news_categories_display_order ON news_categories(display_order);

-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(150) NOT NULL UNIQUE,
    title JSONB NOT NULL,
    excerpt JSONB,
    content JSONB,
    cover_image_url VARCHAR(255),
    gallery_urls JSONB DEFAULT '[]'::jsonb,
    category_id INT REFERENCES news_categories(id) ON DELETE SET NULL,
    author_name VARCHAR(100),
    publish_status VARCHAR(20) DEFAULT 'published',
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_category_id ON news_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_publish_status ON news_articles(publish_status);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_scheduled_at ON news_articles(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_is_featured ON news_articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_news_articles_is_pinned ON news_articles(is_pinned);
CREATE INDEX IF NOT EXISTS idx_news_articles_deleted_at ON news_articles(deleted_at);

-- Create site_alerts table
CREATE TABLE IF NOT EXISTS site_alerts (
    id SERIAL PRIMARY KEY,
    title JSONB NOT NULL,
    message JSONB NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    display_type VARCHAR(20) DEFAULT 'top_banner',
    scope VARCHAR(20) DEFAULT 'all_pages',
    action_text JSONB,
    action_url VARCHAR(255),
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    is_dismissible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_alerts_severity ON site_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_site_alerts_is_active ON site_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_site_alerts_starts_at ON site_alerts(starts_at);
CREATE INDEX IF NOT EXISTS idx_site_alerts_ends_at ON site_alerts(ends_at);
CREATE INDEX IF NOT EXISTS idx_site_alerts_display_order ON site_alerts(display_order);

