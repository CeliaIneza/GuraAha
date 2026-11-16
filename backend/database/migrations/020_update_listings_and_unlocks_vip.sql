-- Migration 020: Add VIP exclusive fields, enable/disable toggle, and property sub-types to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS vip_was_price_rwf BIGINT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS vip_discount_percent NUMERIC(5,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS vip_reason TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS vip_early_access_days INTEGER DEFAULT 7;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sub_type VARCHAR(50);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS condition VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_listings_vip ON listings(is_vip, vip_expires_at);
CREATE INDEX IF NOT EXISTS idx_listings_disabled ON listings(is_disabled);

-- Make payment_id nullable on contact_unlocks so VIP free unlocks (0 RWF) do not require a payment row
ALTER TABLE contact_unlocks ALTER COLUMN payment_id DROP NOT NULL;
