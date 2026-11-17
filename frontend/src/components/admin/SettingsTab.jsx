import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Settings,
  Save,
  Loader2,
  Phone,
  Crown,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Percent,
  Clock,
} from "lucide-react";
import { Panel, RefreshButton, LoadingState } from "./AdminShared";

const DEFAULT_UNLOCK_PRICES = {
  BLOCKER: 500,
  OWNER: 1000,
};

const DEFAULT_SUBSCRIPTION_PLANS = {
  BLOCKER_PRO_WEEKLY: { type: "BLOCKER_PRO", period: "WEEK", priceRwf: 1500, durationDays: 7 },
  BLOCKER_PRO_MONTHLY: { type: "BLOCKER_PRO", period: "MONTH", priceRwf: 5000, durationDays: 30 },
  VIP_ROOM_WEEKLY: { type: "VIP_ROOM", period: "WEEK", priceRwf: 2500, durationDays: 7 },
  VIP_ROOM_MONTHLY: { type: "VIP_ROOM", period: "MONTH", priceRwf: 8000, durationDays: 30 },
  UNLOCK_PASS_WEEKLY: { type: "UNLOCK_PASS", period: "WEEK", priceRwf: 1000, durationDays: 7 },
  UNLOCK_PASS_MONTHLY: { type: "UNLOCK_PASS", period: "MONTH", priceRwf: 3500, durationDays: 30 },
  MONTHLY: { type: "BLOCKER_PRO", period: "MONTH", priceRwf: 5000, durationDays: 30 },
  QUARTERLY: { type: "BLOCKER_PRO", period: "QUARTER", priceRwf: 25000, durationDays: 90 },
  YEARLY: { type: "BLOCKER_PRO", period: "YEAR", priceRwf: 90000, durationDays: 365 },
};

const safeParseJson = (raw, fallback) => {
  if (!raw) return fallback;
  if (typeof raw === "object") return { ...fallback, ...raw };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { ...fallback, ...parsed };
    }
  } catch {
    // ignore parse error
  }
  return fallback;
};

const MANAGED_KEYS = new Set([
  "contact_unlock_prices_rwf",
  "subscription_plans",
  "vip_early_access_days",
  "vip_min_discount_percent",
]);

const prettyKey = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const SettingsTab = ({
  settingsList,
  editingSettings,
  setEditingSettings,
  savingKey,
  loading,
  onRefresh,
  onSave,
}) => {
  const settingsMap = React.useMemo(() => {
    const map = {};
    settingsList.forEach((s) => {
      map[s.key] = s.value;
    });
    return map;
  }, [settingsList]);

  // 1. Contact Unlock Fees state
  const [blockerFee, setBlockerFee] = useState(DEFAULT_UNLOCK_PRICES.BLOCKER);
  const [ownerFee, setOwnerFee] = useState(DEFAULT_UNLOCK_PRICES.OWNER);

  // 2. Subscription Plans state
  const [subPrices, setSubPrices] = useState({
    BLOCKER_PRO_WEEKLY: DEFAULT_SUBSCRIPTION_PLANS.BLOCKER_PRO_WEEKLY.priceRwf,
    BLOCKER_PRO_MONTHLY: DEFAULT_SUBSCRIPTION_PLANS.BLOCKER_PRO_MONTHLY.priceRwf,
    VIP_ROOM_WEEKLY: DEFAULT_SUBSCRIPTION_PLANS.VIP_ROOM_WEEKLY.priceRwf,
    VIP_ROOM_MONTHLY: DEFAULT_SUBSCRIPTION_PLANS.VIP_ROOM_MONTHLY.priceRwf,
    UNLOCK_PASS_WEEKLY: DEFAULT_SUBSCRIPTION_PLANS.UNLOCK_PASS_WEEKLY.priceRwf,
    UNLOCK_PASS_MONTHLY: DEFAULT_SUBSCRIPTION_PLANS.UNLOCK_PASS_MONTHLY.priceRwf,
  });

  // 3. VIP Room Rules state
  const [vipEarlyDays, setVipEarlyDays] = useState("7");
  const [vipMinDiscount, setVipMinDiscount] = useState("10");

  // Sync local structured states whenever settingsList updates from server
  useEffect(() => {
    const parsedUnlock = safeParseJson(
      settingsMap.contact_unlock_prices_rwf,
      DEFAULT_UNLOCK_PRICES
    );
    setBlockerFee(Number(parsedUnlock.BLOCKER ?? DEFAULT_UNLOCK_PRICES.BLOCKER));
    setOwnerFee(Number(parsedUnlock.OWNER ?? DEFAULT_UNLOCK_PRICES.OWNER));

    const parsedPlans = safeParseJson(
      settingsMap.subscription_plans,
      DEFAULT_SUBSCRIPTION_PLANS
    );
    setSubPrices({
      BLOCKER_PRO_WEEKLY: Number(
        parsedPlans.BLOCKER_PRO_WEEKLY?.priceRwf ??
          DEFAULT_SUBSCRIPTION_PLANS.BLOCKER_PRO_WEEKLY.priceRwf
      ),
      BLOCKER_PRO_MONTHLY: Number(
        parsedPlans.BLOCKER_PRO_MONTHLY?.priceRwf ??
          DEFAULT_SUBSCRIPTION_PLANS.BLOCKER_PRO_MONTHLY.priceRwf
      ),
      VIP_ROOM_WEEKLY: Number(
        parsedPlans.VIP_ROOM_WEEKLY?.priceRwf ??
          DEFAULT_SUBSCRIPTION_PLANS.VIP_ROOM_WEEKLY.priceRwf
      ),
      VIP_ROOM_MONTHLY: Number(
        parsedPlans.VIP_ROOM_MONTHLY?.priceRwf ??
          DEFAULT_SUBSCRIPTION_PLANS.VIP_ROOM_MONTHLY.priceRwf
      ),
      UNLOCK_PASS_WEEKLY: Number(
        parsedPlans.UNLOCK_PASS_WEEKLY?.priceRwf ??
          DEFAULT_SUBSCRIPTION_PLANS.UNLOCK_PASS_WEEKLY.priceRwf
      ),
      UNLOCK_PASS_MONTHLY: Number(
        parsedPlans.UNLOCK_PASS_MONTHLY?.priceRwf ??
          DEFAULT_SUBSCRIPTION_PLANS.UNLOCK_PASS_MONTHLY.priceRwf
      ),
    });

    if (settingsMap.vip_early_access_days !== undefined) {
      setVipEarlyDays(String(settingsMap.vip_early_access_days));
    }
    if (settingsMap.vip_min_discount_percent !== undefined) {
      setVipMinDiscount(String(settingsMap.vip_min_discount_percent));
    }
  }, [settingsMap]);

  // Check if Contact Unlock Fees have unsaved changes
  const savedUnlock = safeParseJson(
    settingsMap.contact_unlock_prices_rwf,
    DEFAULT_UNLOCK_PRICES
  );
  const unlockChanged =
    Number(blockerFee) !== Number(savedUnlock.BLOCKER ?? DEFAULT_UNLOCK_PRICES.BLOCKER) ||
    Number(ownerFee) !== Number(savedUnlock.OWNER ?? DEFAULT_UNLOCK_PRICES.OWNER);

  const handleSaveUnlockFees = () => {
    const payload = JSON.stringify({
      OWNER: Math.max(0, Number(ownerFee) || 0),
      BLOCKER: Math.max(0, Number(blockerFee) || 0),
    });
    onSave("contact_unlock_prices_rwf", payload, "Contact Unlock Fees");
  };

  // Check if Subscription Plans have unsaved changes
  const savedPlans = safeParseJson(
    settingsMap.subscription_plans,
    DEFAULT_SUBSCRIPTION_PLANS
  );
  const subsChanged = Object.keys(subPrices).some(
    (planKey) =>
      Number(subPrices[planKey]) !==
      Number(
        savedPlans[planKey]?.priceRwf ??
          DEFAULT_SUBSCRIPTION_PLANS[planKey]?.priceRwf
      )
  );

  const handleSaveSubscriptionPlans = () => {
    const merged = { ...DEFAULT_SUBSCRIPTION_PLANS, ...savedPlans };
    Object.keys(subPrices).forEach((planKey) => {
      const base = merged[planKey] || DEFAULT_SUBSCRIPTION_PLANS[planKey];
      merged[planKey] = {
        ...base,
        priceRwf: Math.max(0, Number(subPrices[planKey]) || 0),
      };
    });
    // Keep legacy MONTHLY synced with BLOCKER_PRO_MONTHLY
    if (merged.MONTHLY) {
      merged.MONTHLY = {
        ...merged.MONTHLY,
        priceRwf: Math.max(0, Number(subPrices.BLOCKER_PRO_MONTHLY) || 0),
      };
    }
    onSave(
      "subscription_plans",
      JSON.stringify(merged),
      "Membership & Subscription Prices"
    );
  };

  const vipDaysChanged =
    String(vipEarlyDays) !== String(settingsMap.vip_early_access_days ?? "7");
  const vipDiscountChanged =
    String(vipMinDiscount) !== String(settingsMap.vip_min_discount_percent ?? "10");

  const extraSettings = settingsList.filter((item) => !MANAGED_KEYS.has(item.key));

  return (
    <Panel
      icon={Settings}
      title="Platform Pricing, Fees & Rules"
      subtitle="Easily manage Mobile Money unlock fees, membership plans, and VIP Room rules"
      actions={<RefreshButton onClick={onRefresh} loading={loading} />}
    >
      {loading && settingsList.length === 0 ? (
        <LoadingState label="Loading pricing & settings..." />
      ) : (
        <div className="space-y-6">
          {/* 1. CONTACT UNLOCK FEES */}
          <div className="rounded-[12px] border border-brand-line bg-white overflow-hidden shadow-2xs">
            <div className="px-5 py-4 bg-brand-bg-soft/60 border-b border-brand-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[9px] bg-brand-pale text-brand-green flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-brand-ink">
                    Pay-Per-Listing Contact Unlock Fees
                  </h4>
                  <p className="text-xs text-brand-ink-soft mt-0.5">
                    Set the one-time Mobile Money amount buyers pay to reveal a phone number or WhatsApp contact on a listing.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleSaveUnlockFees}
                disabled={savingKey === "contact_unlock_prices_rwf" || !unlockChanged}
                variant={unlockChanged ? "default" : "outline"}
                className="h-10 rounded-[9px] font-bold shrink-0"
              >
                {savingKey === "contact_unlock_prices_rwf" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                Save Unlock Fees
              </Button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Blocker Unlock Fee */}
              <div className="p-4 rounded-[10px] border border-brand-line bg-brand-bg-soft/20 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-green" />
                    <span className="font-bold text-sm text-brand-ink">
                      Blocker (Verified Agent) Contact Fee
                    </span>
                  </div>
                  <p className="text-xs text-brand-ink-soft mt-1">
                    Charged when a buyer unlocks the assigned blocker's phone number for guided viewing.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={blockerFee}
                      onChange={(e) => setBlockerFee(e.target.value)}
                      className="h-11 rounded-[9px] pl-3 pr-14 text-base font-extrabold text-brand-ink bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-ink-soft">
                      RWF
                    </span>
                  </div>
                </div>
              </div>

              {/* Property Owner Unlock Fee */}
              <div className="p-4 rounded-[10px] border border-brand-line bg-brand-bg-soft/20 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-sm text-brand-ink">
                      Direct Property Owner Contact Fee
                    </span>
                  </div>
                  <p className="text-xs text-brand-ink-soft mt-1">
                    Charged when a buyer chooses to unlock the direct landlord or seller's phone number.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={ownerFee}
                      onChange={(e) => setOwnerFee(e.target.value)}
                      className="h-11 rounded-[9px] pl-3 pr-14 text-base font-extrabold text-brand-ink bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-ink-soft">
                      RWF
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. MEMBERSHIP & SUBSCRIPTION PLANS */}
          <div className="rounded-[12px] border border-brand-line bg-white overflow-hidden shadow-2xs">
            <div className="px-5 py-4 bg-brand-bg-soft/60 border-b border-brand-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[9px] bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-brand-ink">
                    Membership & Subscription Plans
                  </h4>
                  <p className="text-xs text-brand-ink-soft mt-0.5">
                    Configure weekly (7 days) and monthly (30 days) prices for Blocker Pro, VIP Room, and Unlimited Unlock passes.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleSaveSubscriptionPlans}
                disabled={savingKey === "subscription_plans" || !subsChanged}
                variant={subsChanged ? "default" : "outline"}
                className="h-10 rounded-[9px] font-bold shrink-0"
              >
                {savingKey === "subscription_plans" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                Save Subscription Prices
              </Button>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Blocker Pro */}
              <div className="p-4 rounded-[10px] border border-brand-line bg-brand-bg-soft/20 space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-pale text-brand-green mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> For Blockers
                  </span>
                  <h5 className="font-bold text-sm text-brand-ink">Blocker Pro Plan</h5>
                  <p className="text-xs text-brand-ink-soft mt-0.5">
                    Allows approved blockers to publish and manage verified property listings.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                      Weekly Pass (7 Days)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={subPrices.BLOCKER_PRO_WEEKLY}
                        onChange={(e) =>
                          setSubPrices((prev) => ({
                            ...prev,
                            BLOCKER_PRO_WEEKLY: e.target.value,
                          }))
                        }
                        className="h-10 rounded-[9px] pl-3 pr-14 text-sm font-bold bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-ink-soft">
                        RWF
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                      Monthly Pass (30 Days)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="500"
                        value={subPrices.BLOCKER_PRO_MONTHLY}
                        onChange={(e) =>
                          setSubPrices((prev) => ({
                            ...prev,
                            BLOCKER_PRO_MONTHLY: e.target.value,
                          }))
                        }
                        className="h-10 rounded-[9px] pl-3 pr-14 text-sm font-bold bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-ink-soft">
                        RWF
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIP Room Pass */}
              <div className="p-4 rounded-[10px] border border-brand-line bg-brand-bg-soft/20 space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Exclusive Deals
                  </span>
                  <h5 className="font-bold text-sm text-brand-ink">VIP Room Membership</h5>
                  <p className="text-xs text-brand-ink-soft mt-0.5">
                    Gives buyers early access to discounted VIP properties before the public.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                      Weekly Pass (7 Days)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={subPrices.VIP_ROOM_WEEKLY}
                        onChange={(e) =>
                          setSubPrices((prev) => ({
                            ...prev,
                            VIP_ROOM_WEEKLY: e.target.value,
                          }))
                        }
                        className="h-10 rounded-[9px] pl-3 pr-14 text-sm font-bold bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-ink-soft">
                        RWF
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                      Monthly Pass (30 Days)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="500"
                        value={subPrices.VIP_ROOM_MONTHLY}
                        onChange={(e) =>
                          setSubPrices((prev) => ({
                            ...prev,
                            VIP_ROOM_MONTHLY: e.target.value,
                          }))
                        }
                        className="h-10 rounded-[9px] pl-3 pr-14 text-sm font-bold bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-ink-soft">
                        RWF
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unlimited Unlock Pass */}
              <div className="p-4 rounded-[10px] border border-brand-line bg-brand-bg-soft/20 space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 mb-2">
                    <KeyRound className="w-3.5 h-3.5" /> For Buyers
                  </span>
                  <h5 className="font-bold text-sm text-brand-ink">Unlimited Unlock Pass</h5>
                  <p className="text-xs text-brand-ink-soft mt-0.5">
                    Allows active house-hunters to unlock blocker contacts without paying per listing.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                      Weekly Pass (7 Days)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={subPrices.UNLOCK_PASS_WEEKLY}
                        onChange={(e) =>
                          setSubPrices((prev) => ({
                            ...prev,
                            UNLOCK_PASS_WEEKLY: e.target.value,
                          }))
                        }
                        className="h-10 rounded-[9px] pl-3 pr-14 text-sm font-bold bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-ink-soft">
                        RWF
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                      Monthly Pass (30 Days)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="500"
                        value={subPrices.UNLOCK_PASS_MONTHLY}
                        onChange={(e) =>
                          setSubPrices((prev) => ({
                            ...prev,
                            UNLOCK_PASS_MONTHLY: e.target.value,
                          }))
                        }
                        className="h-10 rounded-[9px] pl-3 pr-14 text-sm font-bold bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-ink-soft">
                        RWF
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. VIP ROOM RULES */}
          <div className="rounded-[12px] border border-brand-line bg-white overflow-hidden shadow-2xs">
            <div className="px-5 py-4 bg-brand-bg-soft/60 border-b border-brand-line flex items-start gap-3">
              <div className="w-10 h-10 rounded-[9px] bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-brand-ink">
                  VIP Room Eligibility & Early Access Rules
                </h4>
                <p className="text-xs text-brand-ink-soft mt-0.5">
                  Control how long VIP listings stay exclusive to VIP members and the minimum discount required.
                </p>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VIP Early Access Days */}
              <div className="p-4 rounded-[10px] border border-brand-line bg-brand-bg-soft/20 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-sm text-brand-ink">
                      VIP Exclusive Early Access Window
                    </span>
                  </div>
                  <p className="text-xs text-brand-ink-soft mt-1">
                    Number of days a newly approved VIP listing remains exclusive to VIP members before moving to public listings.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="1"
                      max="90"
                      value={vipEarlyDays}
                      onChange={(e) => setVipEarlyDays(e.target.value)}
                      className="h-11 rounded-[9px] pl-3 pr-16 text-base font-extrabold text-brand-ink bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-ink-soft">
                      Days
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      onSave(
                        "vip_early_access_days",
                        String(Math.max(1, Number(vipEarlyDays) || 7)),
                        "VIP Early Access Window"
                      )
                    }
                    disabled={savingKey === "vip_early_access_days" || !vipDaysChanged}
                    variant={vipDaysChanged ? "default" : "outline"}
                    className="h-11 rounded-[9px] font-bold shrink-0"
                  >
                    {savingKey === "vip_early_access_days" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </Button>
                </div>
              </div>

              {/* VIP Minimum Discount Percent */}
              <div className="p-4 rounded-[10px] border border-brand-line bg-brand-bg-soft/20 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-sm text-brand-ink">
                      Minimum Required VIP Discount
                    </span>
                  </div>
                  <p className="text-xs text-brand-ink-soft mt-1">
                    Minimum percentage discount off the original price required for a listing to qualify for the VIP Room.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="1"
                      max="90"
                      value={vipMinDiscount}
                      onChange={(e) => setVipMinDiscount(e.target.value)}
                      className="h-11 rounded-[9px] pl-3 pr-12 text-base font-extrabold text-brand-ink bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-ink-soft">
                      %
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      onSave(
                        "vip_min_discount_percent",
                        String(Math.max(1, Number(vipMinDiscount) || 10)),
                        "Minimum VIP Discount"
                      )
                    }
                    disabled={
                      savingKey === "vip_min_discount_percent" || !vipDiscountChanged
                    }
                    variant={vipDiscountChanged ? "default" : "outline"}
                    className="h-11 rounded-[9px] font-bold shrink-0"
                  >
                    {savingKey === "vip_min_discount_percent" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. ADDITIONAL SETTINGS (if any custom settings exist) */}
          {extraSettings.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-brand-ink px-1">
                Additional Platform Parameters
              </h4>
              {extraSettings.map((item) => {
                const currentValue = editingSettings[item.key] ?? item.value;
                const isSaving = savingKey === item.key;
                const hasChanged = String(currentValue) !== String(item.value);
                return (
                  <div
                    key={item.key}
                    className="p-4 rounded-[9px] border border-brand-line bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="max-w-md">
                      <span className="font-bold text-sm text-brand-ink">
                        {prettyKey(item.key)}
                      </span>
                      {item.description && (
                        <p className="text-xs text-brand-ink-soft mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="text"
                        value={currentValue}
                        onChange={(e) =>
                          setEditingSettings((prev) => ({
                            ...prev,
                            [item.key]: e.target.value,
                          }))
                        }
                        className="w-44 h-10 rounded-[9px] px-3 text-sm font-semibold bg-white"
                      />
                      <Button
                        type="button"
                        onClick={() =>
                          onSave(item.key, currentValue, prettyKey(item.key))
                        }
                        disabled={isSaving || !hasChanged}
                        variant={hasChanged ? "default" : "outline"}
                        className="h-10 rounded-[9px] font-bold"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
};