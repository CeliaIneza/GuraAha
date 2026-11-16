export type ContactUnlockType = 'OWNER' | 'BLOCKER';

export type SubscriptionType = 'BLOCKER_PRO' | 'VIP_ROOM' | 'UNLOCK_PASS';
export type SubscriptionPeriod = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

export interface SubscriptionPlanConfig {
  type?: SubscriptionType;
  period?: SubscriptionPeriod;
  priceRwf: number;
  durationDays: number;
}

export const SETTING_KEY_CONTACT_UNLOCK_PRICES = 'contact_unlock_prices_rwf';
export const SETTING_KEY_SUBSCRIPTION_PLANS = 'subscription_plans';
export const SETTING_KEY_VIP_EARLY_ACCESS_DAYS = 'vip_early_access_days';
export const SETTING_KEY_VIP_MIN_DISCOUNT_PERCENT = 'vip_min_discount_percent';

export const DEFAULT_CONTACT_UNLOCK_PRICES_RWF: Record<ContactUnlockType, number> = {
  OWNER: 1000,
  BLOCKER: 500,
};

export const CONTACT_UNLOCK_PRICES_RWF: Record<ContactUnlockType, number> = DEFAULT_CONTACT_UNLOCK_PRICES_RWF;


export const DEFAULT_SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanConfig> = {
  BLOCKER_PRO_WEEKLY: {
    type: 'BLOCKER_PRO',
    period: 'WEEK',
    priceRwf: 1500,
    durationDays: 7,
  },
  BLOCKER_PRO_MONTHLY: {
    type: 'BLOCKER_PRO',
    period: 'MONTH',
    priceRwf: 5000,
    durationDays: 30,
  },
  VIP_ROOM_WEEKLY: {
    type: 'VIP_ROOM',
    period: 'WEEK',
    priceRwf: 2500,
    durationDays: 7,
  },
  VIP_ROOM_MONTHLY: {
    type: 'VIP_ROOM',
    period: 'MONTH',
    priceRwf: 8000,
    durationDays: 30,
  },
  UNLOCK_PASS_WEEKLY: {
    type: 'UNLOCK_PASS',
    period: 'WEEK',
    priceRwf: 1000,
    durationDays: 7,
  },
  UNLOCK_PASS_MONTHLY: {
    type: 'UNLOCK_PASS',
    period: 'MONTH',
    priceRwf: 3500,
    durationDays: 30,
  },

  MONTHLY: {
    type: 'BLOCKER_PRO',
    period: 'MONTH',
    priceRwf: 5000,
    durationDays: 30,
  },
  QUARTERLY: {
    type: 'BLOCKER_PRO',
    period: 'MONTH',
    priceRwf: 25000,
    durationDays: 90,
  },
  YEARLY: {
    type: 'BLOCKER_PRO',
    period: 'YEAR',
    priceRwf: 90000,
    durationDays: 365,
  },
};

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanConfig> = DEFAULT_SUBSCRIPTION_PLANS;

export type SubscriptionPlan = keyof typeof DEFAULT_SUBSCRIPTION_PLANS;

export function isValidSubscriptionPlan(plan: string): plan is SubscriptionPlan {
  return plan.toUpperCase() in DEFAULT_SUBSCRIPTION_PLANS;
}