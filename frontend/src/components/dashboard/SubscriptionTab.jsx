import React from "react";
import { useApp } from "../../context/AppContext";
import { Card, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

export const SubscriptionTab = ({ subscription }) => {
  const { settings, openMoMo } = useApp();

  const blockerSub = subscription?.blockerSubscription;
  const isActive = Boolean(blockerSub?.isActive);
  const subRecord = blockerSub?.subscription;
  const expiresAtRaw = subRecord?.expires_at || subRecord?.expiresAt;
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).toLocaleDateString() : null;

  return (
    <Card className="rounded-[9px] border-brand-line bg-white shadow-sm p-6 sm:p-8 space-y-5">
      <CardTitle className="text-xl font-bold text-brand-ink">
        Blocker Pro Subscription
      </CardTitle>

      <div className="p-4 rounded-[9px] bg-brand-bg-soft border border-brand-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-green mb-1">
            {isActive ? "Active Pro Plan" : "Subscription Status"}
          </div>
          <div className="text-lg font-bold text-brand-ink">
            {isActive
              ? subRecord?.plan?.includes("WEEK")
                ? "Weekly Blocker Pro"
                : "Monthly Blocker Pro"
              : "No Active Subscription"}
          </div>
          <p className="text-xs text-brand-ink-soft mt-0.5">
            {isActive && expiresAt ? (
              <>
                Expires on <strong>{expiresAt}</strong>
              </>
            ) : (
              "Subscribe with MTN Mobile Money to post & manage property listings."
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              openMoMo?.({
                kind: "subscription-weekly",
                amount: settings?.blockerProWeekly || 1500,
                title: "Blocker Pro (Weekly)",
                listingId: null,
              })
            }
            className="rounded-[9px] font-semibold text-xs sm:text-sm"
          >
            {isActive ? "Extend Weekly" : "Subscribe Weekly"} ({Number(settings?.blockerProWeekly || 1500).toLocaleString()} RWF)
          </Button>
          <Button
            variant="default"
            onClick={() =>
              openMoMo?.({
                kind: "subscription-monthly",
                amount: settings?.blockerProMonthly || 5000,
                title: "Blocker Pro (Monthly)",
                listingId: null,
              })
            }
            className="rounded-[9px] font-semibold text-xs sm:text-sm"
          >
            {isActive ? "Extend Monthly" : "Subscribe Monthly"} ({Number(settings?.blockerProMonthly || 5000).toLocaleString()} RWF)
          </Button>
        </div>
      </div>
    </Card>
  );
};