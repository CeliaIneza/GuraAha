CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE CASCADE,

    phone VARCHAR(20) NOT NULL,

    purpose VARCHAR(30) NOT NULL,

    code_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    verified_at TIMESTAMPTZ,

    attempts INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_verifications_phone_purpose
    ON otp_verifications(phone, purpose);

CREATE INDEX idx_otp_verifications_user_id
    ON otp_verifications(user_id);

CREATE INDEX idx_otp_verifications_expires_at
    ON otp_verifications(expires_at);