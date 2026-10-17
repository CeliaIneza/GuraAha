export type ContactUnlockType = 'OWNER' | 'BLOCKER';

export const CONTACT_UNLOCK_PRICES_RWF: Record<ContactUnlockType, number> = {
  OWNER: 1000,
  BLOCKER: 500
};

export interface SubscriptionPlanConfig {
    priceRwf: number;
    durationDays: number;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanConfig> = {
    MONTHLY: {
        priceRwf: 5000,
        durationDays: 30
    },
    QUARTERLY: {
        priceRwf: 25000,
        durationDays: 90
    },
    YEARLY: {
        priceRwf: 90000,
        durationDays: 365
    }
};

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

export function isValidSubscriptionPlan(plan: string): plan is SubscriptionPlan {
    return plan in SUBSCRIPTION_PLANS;
}