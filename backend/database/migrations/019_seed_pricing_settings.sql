-- Migration 019: Seed dynamic pricing & subscription plan settings
INSERT INTO settings (key, value, description)
VALUES
  (
    'contact_unlock_prices_rwf',
    '{"OWNER": 1000, "BLOCKER": 500}',
    'Dynamic contact unlock prices in RWF by party type (OWNER, BLOCKER)'
  ),
  (
    'subscription_plans',
    '{"MONTHLY": {"priceRwf": 5000, "durationDays": 30}, "QUARTERLY": {"priceRwf": 25000, "durationDays": 90}, "YEARLY": {"priceRwf": 90000, "durationDays": 365}}',
    'Dynamic blocker subscription tiers, pricing (RWF), and duration (days)'
  )
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
