-- Expand subscriptions table for both Blocker Pro and VIP Room memberships
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Backfill user_id from existing blocker profiles
UPDATE subscriptions s
SET user_id = bp.user_id
FROM blocker_profiles bp
WHERE s.blocker_id = bp.id AND s.user_id IS NULL;

-- Make blocker_id nullable for non-blocker subscriptions (such as VIP Room and Unlock Pass)
ALTER TABLE subscriptions ALTER COLUMN blocker_id DROP NOT NULL;

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(30) NOT NULL DEFAULT 'BLOCKER_PRO';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS period VARCHAR(20) NOT NULL DEFAULT 'MONTH';

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_type_status
    ON subscriptions(user_id, subscription_type, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_type
    ON subscriptions(subscription_type);
