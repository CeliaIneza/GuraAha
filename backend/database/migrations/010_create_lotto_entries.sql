CREATE TABLE lotto_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    contact_unlock_id UUID NOT NULL UNIQUE
        REFERENCES contact_unlocks(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lotto_entries_user_id
    ON lotto_entries(user_id);