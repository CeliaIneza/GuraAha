-- 1. Allow multiple lotto entries per contact_unlock (e.g., VIP double lotto entries)
ALTER TABLE lotto_entries
  DROP CONSTRAINT IF EXISTS lotto_entries_contact_unlock_id_key;

CREATE INDEX IF NOT EXISTS idx_lotto_entries_contact_unlock_id
  ON lotto_entries(contact_unlock_id);

-- 2. Add missing cancelled_at and updated_at columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Per-user read state for broadcast notifications (where notifications.user_id IS NULL)
CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user
  ON notification_reads(user_id);

-- 4. Add email column to alert_subscriptions for email-based notifications
ALTER TABLE alert_subscriptions
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 5. Ensure QUARTERLY subscription plan period is QUARTER
UPDATE settings
SET value = jsonb_set(value::jsonb, '{QUARTERLY,period}', '"QUARTER"', false)::text
WHERE key = 'subscription_plans'
  AND (value::jsonb ? 'QUARTERLY');
