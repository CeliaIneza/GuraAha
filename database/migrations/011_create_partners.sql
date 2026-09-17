CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    type VARCHAR(30) NOT NULL,

    name VARCHAR(255) NOT NULL,

    phone VARCHAR(20),
    email VARCHAR(255),

    location_id UUID
        REFERENCES locations(id),

    description_rw TEXT,
    description_en TEXT,
    description_fr TEXT,

    is_certified BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partners_location_id
    ON partners(location_id);

CREATE INDEX idx_partners_type
    ON partners(type);

CREATE INDEX idx_partners_active
    ON partners(is_active);