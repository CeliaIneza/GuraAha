CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    role_id SMALLINT NOT NULL
        REFERENCES roles(id),

    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,

    password_hash TEXT,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    phone_verified_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);