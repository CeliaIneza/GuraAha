ALTER TABLE blocker_profiles ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE blocker_profiles ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS admin_note TEXT;
