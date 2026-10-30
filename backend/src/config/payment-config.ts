export type ContactUnlockType = 'OWNER' | 'BLOCKER';

export interface SubscriptionPlanConfig {
  priceRwf: number;
  durationDays: number;
}

export const SETTING_KEY_CONTACT_UNLOCK_PRICES = 'contact_unlock_prices_rwf';
export const SETTING_KEY_SUBSCRIPTION_PLANS = 'subscription_plans';

/**
 * Default fallback prices for contact unlocking.
*/
export const DEFAULT_CONTACT_UNLOCK_PRICES_RWF: Record<ContactUnlockType, number> = {
  OWNER: 1000,
  BLOCKER: 500,
};

/**
 * @deprecated Prefer dynamic retrieval via SettingService.getContactUnlockPrice(type)
 */
export const CONTACT_UNLOCK_PRICES_RWF: Record<ContactUnlockType, number> = DEFAULT_CONTACT_UNLOCK_PRICES_RWF;

/**
 * Default fallback subscription plans.
 */
export const DEFAULT_SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanConfig> = {
  MONTHLY: {
    priceRwf: 5000,
    durationDays: 30,
  },
  QUARTERLY: {
    priceRwf: 25000,
    durationDays: 90,
  },
  YEARLY: {
    priceRwf: 90000,
    durationDays: 365,
  },
};

/**
 * @deprecated Prefer dynamic retrieval via SettingService.getSubscriptionPlan(plan)
 */
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanConfig> = DEFAULT_SUBSCRIPTION_PLANS;

export type SubscriptionPlan = keyof typeof DEFAULT_SUBSCRIPTION_PLANS;

export function isValidSubscriptionPlan(plan: string): plan is SubscriptionPlan {
  return plan.toUpperCase() in DEFAULT_SUBSCRIPTION_PLANS;
}