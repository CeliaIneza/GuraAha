CREATE TABLE contact_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    listing_id UUID NOT NULL
        REFERENCES listings(id),

    payment_id UUID NOT NULL
        REFERENCES payments(id),

    type VARCHAR(20) NOT NULL,

    amount_rwf BIGINT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, listing_id, type)
);

CREATE INDEX idx_contact_unlocks_user_id
    ON contact_unlocks(user_id);

CREATE INDEX idx_contact_unlocks_listing_id
    ON contact_unlocks(listing_id);

CREATE INDEX idx_contact_unlocks_payment_id
    ON contact_unlocks(payment_id);