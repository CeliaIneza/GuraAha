-- Create tables for News Articles, Notifications, and Alert Subscriptions
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(50) NOT NULL,
    title_rw VARCHAR(255),
    title_en VARCHAR(255),
    title_fr VARCHAR(255),
    summary TEXT NOT NULL,
    body_rw TEXT,
    body_en TEXT,
    body_fr TEXT,
    image_url TEXT,
    read_time VARCHAR(20) DEFAULT '3 min',
    target_districts TEXT[],
    author_name VARCHAR(100) DEFAULT 'GuraAha Insights team',
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_topic ON news_articles(topic);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(is_published, published_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    icon VARCHAR(20) NOT NULL DEFAULT '🔔',
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    action_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOM',
    action_id VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS alert_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    phone VARCHAR(30) NOT NULL,
    topics TEXT[] NOT NULL DEFAULT ARRAY['Land & plots', 'Construction', 'Auctions', 'VIP deals'],
    districts TEXT[],
    channels TEXT[] NOT NULL DEFAULT ARRAY['IN_APP', 'SMS'],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_alert_subscriptions_phone UNIQUE (phone)
);

CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_phone ON alert_subscriptions(phone);
CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_active ON alert_subscriptions(is_active);
