-- Seed expanded membership plans (Weekly & Monthly for Blocker Pro, VIP Room, Unlock Pass) and VIP settings
INSERT INTO settings (key, value, description)
VALUES
  (
    'subscription_plans',
    '{
      "BLOCKER_PRO_WEEKLY": { "type": "BLOCKER_PRO", "period": "WEEK", "priceRwf": 1500, "durationDays": 7 },
      "BLOCKER_PRO_MONTHLY": { "type": "BLOCKER_PRO", "period": "MONTH", "priceRwf": 5000, "durationDays": 30 },
      "VIP_ROOM_WEEKLY": { "type": "VIP_ROOM", "period": "WEEK", "priceRwf": 2500, "durationDays": 7 },
      "VIP_ROOM_MONTHLY": { "type": "VIP_ROOM", "period": "MONTH", "priceRwf": 8000, "durationDays": 30 },
      "UNLOCK_PASS_WEEKLY": { "type": "UNLOCK_PASS", "period": "WEEK", "priceRwf": 1000, "durationDays": 7 },
      "UNLOCK_PASS_MONTHLY": { "type": "UNLOCK_PASS", "period": "MONTH", "priceRwf": 3500, "durationDays": 30 },
      "MONTHLY": { "type": "BLOCKER_PRO", "period": "MONTH", "priceRwf": 5000, "durationDays": 30 },
      "QUARTERLY": { "type": "BLOCKER_PRO", "period": "MONTH", "priceRwf": 25000, "durationDays": 90 },
      "YEARLY": { "type": "BLOCKER_PRO", "period": "YEAR", "priceRwf": 90000, "durationDays": 365 }
    }',
    'Dynamic membership and subscription tiers (Weekly & Monthly for Blocker Pro, VIP Room, and Unlock Pass)'
  ),
  (
    'vip_early_access_days',
    '7',
    'Window in days during which VIP exclusive deals are reserved for VIP subscribers before going public'
  ),
  (
    'vip_min_discount_percent',
    '10',
    'Minimum discount percentage required for a listing to qualify for the VIP Room'
  )
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
