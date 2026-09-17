CREATE TYPE user_role AS ENUM ('admin', 'blocker', 'buyer');
CREATE TYPE location_level AS ENUM ('province', 'district', 'sector', 'cell', 'village');
CREATE TYPE blocker_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE listing_type AS ENUM ('land', 'house');
CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE unlock_type AS ENUM ('blocker', 'owner');
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'failed');
CREATE TYPE payment_purpose AS ENUM ('subscription', 'unlock');
CREATE TYPE subscription_type AS ENUM ('blocker_pro', 'unlock_pass');
CREATE TYPE subscription_period AS ENUM ('weekly', 'monthly');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE language_code AS ENUM ('rw', 'en', 'fr');
CREATE TYPE partner_type AS ENUM ('surveyor', 'notary', 'engineer');

-- ---------- locations ----------
CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT REFERENCES locations(id) ON DELETE RESTRICT,
    level location_level NOT NULL,
    name VARCHAR(150) NOT NULL,
    highlights TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_locations_parent_id ON locations(parent_id);
CREATE INDEX idx_locations_level ON locations(level);

-- ---------- users ----------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash TEXT,                       -- argon2 hash; nullable if OTP-only login — TBD
    role user_role NOT NULL DEFAULT 'buyer',
    full_name VARCHAR(150),
    phone_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- blocker_profiles ----------
CREATE TABLE blocker_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    national_id VARCHAR(30) NOT NULL UNIQUE,
    operating_location_id BIGINT NOT NULL REFERENCES locations(id),
    unique_code VARCHAR(10) NOT NULL UNIQUE,   -- e.g. K7X2PM, sent via SMS
    status blocker_status NOT NULL DEFAULT 'pending',
    agreement_signed_at TIMESTAMPTZ,
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_blocker_profiles_status ON blocker_profiles(status);

-- ---------- listings ----------
CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,
    blocker_id BIGINT NOT NULL REFERENCES users(id),
    location_id BIGINT NOT NULL REFERENCES locations(id),
    type listing_type NOT NULL,
    price NUMERIC(14,2) NOT NULL,
    size_sqm NUMERIC(12,2),
    upi VARCHAR(50),                           -- Unique Parcel Identifier
    owner_name VARCHAR(150),
    owner_contact VARCHAR(20) NOT NULL,        -- NEVER returned by API pre-unlock
    ownership_proof_url TEXT,                  -- admin-only visibility
    status listing_status NOT NULL DEFAULT 'pending',
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_listings_location_id ON listings(location_id);
CREATE INDEX idx_listings_blocker_id ON listings(blocker_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_type_status ON listings(type, status);

-- ---------- listing_photos ----------
CREATE TABLE listing_photos (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    position SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_listing_photos_listing_id ON listing_photos(listing_id);

-- ---------- listing_translations ----------
CREATE TABLE listing_translations (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    lang language_code NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    UNIQUE (listing_id, lang)
);

-- ---------- subscriptions ----------
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    type subscription_type NOT NULL,
    period subscription_period NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ---------- payments ----------
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    purpose payment_purpose NOT NULL,
    momo_reference VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    raw_response JSONB,                        -- audit trail of MoMo callback
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ
);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ---------- contact_unlocks ----------
CREATE TABLE contact_unlocks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    listing_id BIGINT NOT NULL REFERENCES listings(id),
    unlock_type unlock_type NOT NULL,
    payment_id BIGINT NOT NULL REFERENCES payments(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, listing_id, unlock_type)   -- double-charge structurally impossible
);

-- ---------- lotto_entries ----------
CREATE TABLE lotto_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    unlock_id BIGINT NOT NULL REFERENCES contact_unlocks(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- partners ----------
CREATE TABLE partners (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type partner_type NOT NULL,
    location_id BIGINT NOT NULL REFERENCES locations(id),
    contact VARCHAR(20) NOT NULL,
    certification_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_partners_location_id ON partners(location_id);

-- ---------- settings ----------
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);