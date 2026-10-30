import { SettingRepository, SettingDbRow } from "../repositories/setting.repository";
import { PUBLIC_SETTING_KEYS } from "../validators/setting.validator";
import {
    ContactUnlockType,
    SubscriptionPlanConfig,
    DEFAULT_CONTACT_UNLOCK_PRICES_RWF,
    DEFAULT_SUBSCRIPTION_PLANS,
    SETTING_KEY_CONTACT_UNLOCK_PRICES,
    SETTING_KEY_SUBSCRIPTION_PLANS,
} from "../config/payment-config";

const DEFAULT_PUBLIC_SETTINGS: Record<string, string> = {
    [SETTING_KEY_CONTACT_UNLOCK_PRICES]: JSON.stringify(DEFAULT_CONTACT_UNLOCK_PRICES_RWF),
    [SETTING_KEY_SUBSCRIPTION_PLANS]: JSON.stringify(DEFAULT_SUBSCRIPTION_PLANS),
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
                    const normalized: Record<string, SubscriptionPlanConfig> = {};
                    for (const [key, val] of Object.entries(parsed)) {
                        if (val && typeof val === 'object' && 'priceRwf' in val && 'durationDays' in val) {
                            normalized[key.toUpperCase()] = {
                                priceRwf: Number((val as any).priceRwf),
                                durationDays: Number((val as any).durationDays),
                            };
                        }
                    }
                    if (Object.keys(normalized).length > 0) {
                        return normalized;
                    }
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
}
