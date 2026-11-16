import React from "react";
import { useApp } from "../../context/AppContext";
import { Card, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

export const SubscriptionTab = ({ subscription }) => {
  const { settings, openMoMo } = useApp();

  const expiresAt = new Date(
    subscription?.expires_at || subscription?.expiresAt || Date.now() + 2592000000
  ).toLocaleDateString();

  return (
    <Card className="rounded-[9px] border-brand-line bg-white shadow-sm p-6 sm:p-8 space-y-5">
      <CardTitle className="text-xl font-bold text-brand-ink">
        Active Blocker Subscription
      </CardTitle>

      <div className="p-4 rounded-[9px] bg-brand-bg-soft border border-brand-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-green mb-1">
            Pro Plan Status
          </div>
          <div className="text-lg font-bold text-brand-ink">Monthly Unlimited Tier</div>
          <p className="text-xs text-brand-ink-soft mt-0.5">
            Expires on <strong>{expiresAt}</strong>
          </p>
        </div>

        <Button
          variant="default"
          onClick={() =>
            openMoMo?.({
              kind: "subscription-monthly",
              amount: settings?.blockerProMonthly || 5000,
              title: "Renew Blocker Pro Monthly",
              listingId: null,
            })
          }
          className="rounded-[9px] font-semibold text-xs sm:text-sm"
        >
          Renew / Extend Plan
        </Button>
      </div>
    </Card>
  );
};