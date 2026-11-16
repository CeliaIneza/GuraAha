ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE payments
    ADD CONSTRAINT payments_amount_positive_check
    CHECK (amount_rwf > 0);

ALTER TABLE payments
    ADD CONSTRAINT payments_status_check
    CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'));

ALTER TABLE payments
    ADD CONSTRAINT payments_purpose_check
    CHECK (purpose IN ('CONTACT_UNLOCK', 'SUBSCRIPTION'));

ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED'));

ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_date_range_check
    CHECK (expires_at > starts_at);

-- Prevent negative or zero subscription payment amounts
-- through the payments constraint above.
