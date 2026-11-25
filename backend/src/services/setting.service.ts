import { SettingRepository, SettingDbRow } from "../repositories/setting.repository";
import { PUBLIC_SETTING_KEYS } from "../validators/setting.validator";
import { db } from "../config/database";
import {
    ContactUnlockType,
    SubscriptionPlanConfig,
    DEFAULT_CONTACT_UNLOCK_PRICES_RWF,
    DEFAULT_SUBSCRIPTION_PLANS,
    SETTING_KEY_CONTACT_UNLOCK_PRICES,
    SETTING_KEY_SUBSCRIPTION_PLANS,
    SETTING_KEY_VIP_EARLY_ACCESS_DAYS,
    SETTING_KEY_VIP_MIN_DISCOUNT_PERCENT,
} from "../config/payment-config";

const DEFAULT_PUBLIC_SETTINGS: Record<string, string> = {
    [SETTING_KEY_CONTACT_UNLOCK_PRICES]: JSON.stringify(DEFAULT_CONTACT_UNLOCK_PRICES_RWF),
    [SETTING_KEY_SUBSCRIPTION_PLANS]: JSON.stringify(DEFAULT_SUBSCRIPTION_PLANS),
    [SETTING_KEY_VIP_EARLY_ACCESS_DAYS]: "7",
    [SETTING_KEY_VIP_MIN_DISCOUNT_PERCENT]: "10",
    lotto_prize_rwf: "250000",
    home_featured_min: "3",
    home_latest_count: "6",
    contact_unlock_fee_rwf: "1000",
    subscription_pricing: JSON.stringify({
        MONTHLY: 5000,
        QUARTERLY: 25000,
        YEARLY: 90000,
    }),
    lotto_ticket_price_rwf: "1000",
    support_phone: "+250788000000",
    support_email: "support@guraaha.rw",
    support_whatsapp: "+250788000000",
    maintenance_mode: "false",
    app_min_version: "1.0.0",
    terms_version: "1.0",
};

export class SettingService {
    constructor(
        private readonly settingRepository: SettingRepository = new SettingRepository()
    ) {}

    async getPublicSettings(): Promise<Record<string, any>> {
        const rows = await this.settingRepository.getByKeys([...PUBLIC_SETTING_KEYS]);
        const map: Record<string, any> = { ...DEFAULT_PUBLIC_SETTINGS };

        for (const row of rows) {
            try {
                map[row.key] = JSON.parse(row.value);
            } catch {
                map[row.key] = row.value;
            }
        }

        for (const key of Object.keys(map)) {
            if (typeof map[key] === "string" && (map[key].startsWith("{") || map[key].startsWith("["))) {
                try {
                    map[key] = JSON.parse(map[key]);
                } catch {
                    // keep as string
                }
            }
        }

        try {
            const statsRes = await db.query(`
                SELECT
                    (SELECT COUNT(*)::int FROM listings WHERE status = 'APPROVED' AND is_disabled = FALSE) AS listings_count,
                    (SELECT COUNT(*)::int FROM blocker_profiles WHERE status = 'APPROVED') AS verified_blockers_count,
                    (SELECT COUNT(*)::int FROM locations WHERE level = 'DISTRICT' AND is_active = TRUE) AS districts_count,
                    (SELECT COUNT(*)::int FROM contact_unlocks) AS contacts_unlocked_count
            `);
            const s = statsRes.rows[0] || {};
            map.live_stats = {
                listingsCount: Number(s.listings_count ?? 0),
                verifiedBlockersCount: Number(s.verified_blockers_count ?? 0),
                districtsCount: Number(s.districts_count || 30),
                contactsUnlockedCount: Number(s.contacts_unlocked_count ?? 0),
            };
        } catch {
            map.live_stats = {
                listingsCount: 0,
                verifiedBlockersCount: 0,
                districtsCount: 30,
                contactsUnlockedCount: 0,
            };
        }

        return map;
    }

    async getAllSettings(): Promise<SettingDbRow[]> {
        return this.settingRepository.getAll();
    }

    async getSettingByKey(key: string): Promise<SettingDbRow> {
        const setting = await this.settingRepository.getByKey(key);
        if (!setting) {
            throw new Error(`Setting with key '${key}' not found`);
        }
        return setting;
    }

    async upsertSetting(key: string, value: string, description?: string | null): Promise<SettingDbRow> {
        return this.settingRepository.upsert(key, value, description);
    }

    async deleteSetting(key: string): Promise<void> {
        const deleted = await this.settingRepository.delete(key);
        if (!deleted) {
            throw new Error(`Setting with key '${key}' not found`);
        }
    }

    async getContactUnlockPrices(): Promise<Record<ContactUnlockType, number>> {
        try {
            const row = await this.settingRepository.getByKey(SETTING_KEY_CONTACT_UNLOCK_PRICES);
            if (row && row.value) {
                const parsed = JSON.parse(row.value);
                if (typeof parsed === 'object' && parsed !== null) {
                    return {
                        OWNER: typeof parsed.OWNER === 'number' ? parsed.OWNER : DEFAULT_CONTACT_UNLOCK_PRICES_RWF.OWNER,
                        BLOCKER: typeof parsed.BLOCKER === 'number' ? parsed.BLOCKER : DEFAULT_CONTACT_UNLOCK_PRICES_RWF.BLOCKER,
                    };
                }
            }
        } catch (err) {
            console.warn(`Failed to parse ${SETTING_KEY_CONTACT_UNLOCK_PRICES} from settings, using default fallback:`, err);
        }
        return { ...DEFAULT_CONTACT_UNLOCK_PRICES_RWF };
    }

    async getContactUnlockPrice(type: ContactUnlockType): Promise<number> {
        const prices = await this.getContactUnlockPrices();
        const price = prices[type];
        if (typeof price !== 'number') {
            return DEFAULT_CONTACT_UNLOCK_PRICES_RWF[type] ?? 1000;
        }
        return price;
    }

    async getSubscriptionPlans(): Promise<Record<string, SubscriptionPlanConfig>> {
        try {
            const row = await this.settingRepository.getByKey(SETTING_KEY_SUBSCRIPTION_PLANS);
            if (row && row.value) {
                const parsed = JSON.parse(row.value);
                if (typeof parsed === 'object' && parsed !== null) {
                    const normalized: Record<string, SubscriptionPlanConfig> = {
                        ...DEFAULT_SUBSCRIPTION_PLANS,
                    };
                    for (const [key, val] of Object.entries(parsed)) {
                        if (val && typeof val === 'object' && 'priceRwf' in val && 'durationDays' in val) {
                            const upperKey = key.toUpperCase();
                            const fallback = DEFAULT_SUBSCRIPTION_PLANS[upperKey];
                            normalized[upperKey] = {
                                type: (val as any).type ?? fallback?.type,
                                period: (val as any).period ?? fallback?.period,
                                priceRwf: Number((val as any).priceRwf),
                                durationDays: Number((val as any).durationDays),
                            };
                        }
                    }
                    return normalized;
                }
            }
        } catch (err) {
            console.warn(`Failed to parse ${SETTING_KEY_SUBSCRIPTION_PLANS} from settings, using default fallback:`, err);
        }
        return { ...DEFAULT_SUBSCRIPTION_PLANS };
    }

    async getSubscriptionPlan(plan: string): Promise<SubscriptionPlanConfig | null> {
        const plans = await this.getSubscriptionPlans();
        const config = plans[plan.toUpperCase()];
        return config ?? null;
    }

    async isValidSubscriptionPlan(plan: string): Promise<boolean> {
        const config = await this.getSubscriptionPlan(plan);
        return config !== null;
    }

    async getVipEarlyAccessDays(): Promise<number> {
        try {
            const row = await this.settingRepository.getByKey(SETTING_KEY_VIP_EARLY_ACCESS_DAYS);
            if (row && row.value) {
                const days = parseInt(row.value, 10);
                if (!isNaN(days) && days > 0) return days;
            }
        } catch {}
        return 7;
    }

    async getVipMinDiscountPercent(): Promise<number> {
        try {
            const row = await this.settingRepository.getByKey(SETTING_KEY_VIP_MIN_DISCOUNT_PERCENT);
            if (row && row.value) {
                const pct = parseFloat(row.value);
                if (!isNaN(pct) && pct >= 0) return pct;
            }
        } catch {}
        return 10;
    }
}
