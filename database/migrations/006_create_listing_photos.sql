CREATE TABLE listing_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    listing_id UUID NOT NULL
        REFERENCES listings(id)
        ON DELETE CASCADE,

    file_path TEXT NOT NULL,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_photos_listing_id
    ON listing_photos(listing_id);