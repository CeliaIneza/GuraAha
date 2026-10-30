import { z } from "zod";

export const upsertSettingSchema = z.object({
    value: z.string().min(1, "Setting value is required"),
    description: z.string().max(500).optional().nullable(),
});

export type UpsertSettingInput = z.infer<typeof upsertSettingSchema>;

export const PUBLIC_SETTING_KEYS = [
    "contact_unlock_prices_rwf",
    "subscription_plans",
    "contact_unlock_fee_rwf",
    "subscription_pricing",
    "lotto_ticket_price_rwf",
    "support_phone",
    "support_email",
    "support_whatsapp",
    "app_min_version",
    "maintenance_mode",
    "terms_version"
] as const;

