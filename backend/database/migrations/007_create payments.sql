CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    provider VARCHAR(30) NOT NULL,

    provider_reference VARCHAR(255),

    amount_rwf BIGINT NOT NULL,

    purpose VARCHAR(40) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    raw_response JSONB,

    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id
    ON payments(user_id);

CREATE INDEX idx_payments_provider_reference
    ON payments(provider_reference);

CREATE INDEX idx_payments_status
    ON payments(status);