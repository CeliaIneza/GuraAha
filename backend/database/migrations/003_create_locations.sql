CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    parent_id UUID
        REFERENCES locations(id),

    level VARCHAR(20) NOT NULL,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),

    investment_highlights TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_parent_id
    ON locations(parent_id);

CREATE INDEX idx_locations_level
    ON locations(level);