DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgcrypto not available, continuing without it';
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'gen_random_uuid') THEN
    EXECUTE $fn$
      CREATE FUNCTION gen_random_uuid() RETURNS uuid AS $body$
        SELECT uuid_in(
          overlay(
            overlay(md5(random()::text || ':' || clock_timestamp()::text) placing '4' from 13)
            placing to_hex(floor(random() * 4 + 8)::int) from 17
          )::cstring
        )
      $body$ LANGUAGE sql VOLATILE
    $fn$;
  END IF;
END $$;


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