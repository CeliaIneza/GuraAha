CREATE TABLE blocker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES users(id),

    national_id VARCHAR(50) NOT NULL UNIQUE,

    operating_location_id UUID
        REFERENCES locations(id),

    verification_code VARCHAR(20) UNIQUE,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    agreement_document_path TEXT,

    rejection_reason TEXT,

    reviewed_by UUID
        REFERENCES users(id),

    reviewed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blocker_profiles_operating_location
    ON blocker_profiles(operating_location_id);

CREATE INDEX idx_blocker_profiles_status
    ON blocker_profiles(status);