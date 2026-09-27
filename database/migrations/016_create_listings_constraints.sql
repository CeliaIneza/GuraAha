ALTER TABLE listings
    ADD CONSTRAINT listings_status_check
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));


ALTER TABLE listings
    ADD CONSTRAINT listings_title_language_check
    CHECK (title_rw IS NOT NULL OR title_en IS NOT NULL OR title_fr IS NOT NULL);


CREATE UNIQUE INDEX idx_listings_active_upi_number
    ON listings (upi_number)
    WHERE upi_number IS NOT NULL AND status IN ('PENDING', 'APPROVED');


CREATE OR REPLACE FUNCTION check_listing_village_level()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM locations
        WHERE id = NEW.village_id AND level = 'VILLAGE'
    ) THEN
        RAISE EXCEPTION 'village id must reference a location at the VILLAGE level';
        END IF;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_check_listing_village_level
    BEFORE INSERT OR UPDATE OF village_id ON listings
    FOR EACH ROW EXECUTE FUNCTION check_listing_village_level();