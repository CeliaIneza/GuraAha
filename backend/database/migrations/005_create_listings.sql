CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    blocker_id UUID NOT NULL
        REFERENCES blocker_profiles(id),

    village_id UUID NOT NULL
        REFERENCES locations(id),

    type VARCHAR(30) NOT NULL,

    title_rw VARCHAR(255),
    title_en VARCHAR(255),
    title_fr VARCHAR(255),

    description_rw TEXT,
    description_en TEXT,
    description_fr TEXT,

    price_rwf BIGINT NOT NULL,

    size_value NUMERIC(14,2) NOT NULL,
    size_unit VARCHAR(20) NOT NULL,

    upi_number VARCHAR(100),

    owner_name VARCHAR(255),
    owner_phone VARCHAR(20),

    ownership_document_path TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    rejection_reason TEXT,

    reviewed_by UUID
        REFERENCES users(id),

    reviewed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_blocker_id
    ON listings(blocker_id);

CREATE INDEX idx_listings_village_status
    ON listings(village_id, status);

CREATE INDEX idx_listings_status
    ON listings(status);

CREATE INDEX idx_listings_type
    ON listings(type);