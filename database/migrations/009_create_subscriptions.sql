CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    blocker_id UUID NOT NULL
        REFERENCES blocker_profiles(id),

    plan VARCHAR(30) NOT NULL,

    payment_id UUID
        REFERENCES payments(id),

    starts_at TIMESTAMPTZ NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_blocker_status
    ON subscriptions(blocker_id, status);

CREATE INDEX idx_subscriptions_expires_at
    ON subscriptions(expires_at);