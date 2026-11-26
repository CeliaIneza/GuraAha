import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { Card, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Star, Unlock, ShieldCheck } from "lucide-react";

export const SubscriptionTab = ({ subscription, isBlocker: isBlockerProp }) => {
  const { settings, openMoMo } = useApp();
  const { user } = useAuth();

  const isBlocker =
    isBlockerProp !== undefined ? isBlockerProp : user?.role === "BLOCKER";

  const blockerSub = subscription?.blockerSubscription;
  const isBlockerActive = Boolean(blockerSub?.isActive);
  const blockerRecord = blockerSub?.subscription;
  const blockerExpiresRaw = blockerRecord?.expires_at || blockerRecord?.expiresAt;
  const blockerExpires = blockerExpiresRaw
    ? new Date(blockerExpiresRaw).toLocaleDateString()
    : null;

  const vipSub = subscription?.vipSubscription;
  const isVipActive = Boolean(vipSub?.isActive);
  const vipRecord = vipSub?.subscription;
  const vipExpiresRaw = vipRecord?.expires_at || vipRecord?.expiresAt;
  const vipExpires = vipExpiresRaw ? new Date(vipExpiresRaw).toLocaleDateString() : null;

  const passSub = subscription?.unlockPassSubscription;
  const isPassActive = Boolean(passSub?.isActive);
  const passRecord = passSub?.subscription;
  const passExpiresRaw = passRecord?.expires_at || passRecord?.expiresAt;
  const passExpires = passExpiresRaw ? new Date(passExpiresRaw).toLocaleDateString() : null;

  return (
    <div className="space-y-6">
      {/* ── Blocker Pro Subscription (Only for Blockers) ── */}
      {isBlocker && (
        <Card className="rounded-[12px] border-brand-line bg-white shadow-xs p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-brand-green" />
            <CardTitle className="text-xl font-bold text-brand-ink">
              Blocker Pro Subscription
            </CardTitle>
          </div>

          <div className="p-4 rounded-[10px] bg-brand-bg-soft border border-brand-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-green mb-1">
                {isBlockerActive ? "Active Pro Plan" : "Subscription Status"}
              </div>
              <div className="text-lg font-bold text-brand-ink">
                {isBlockerActive
                  ? blockerRecord?.plan?.includes("WEEK")
                    ? "Weekly Blocker Pro"
                    : "Monthly Blocker Pro"
                  : "No Active Blocker Pro Subscription"}
              </div>
              <p className="text-xs text-brand-ink-soft mt-0.5">
                {isBlockerActive && blockerExpires ? (
                  <>
                    Expires on <strong>{blockerExpires}</strong>
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
                {isBlockerActive ? "Extend Weekly" : "Subscribe Weekly"} (
                {Number(settings?.blockerProWeekly || 1500).toLocaleString()} RWF)
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
                {isBlockerActive ? "Extend Monthly" : "Subscribe Monthly"} (
                {Number(settings?.blockerProMonthly || 5000).toLocaleString()} RWF)
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Buyer & Investor Subscriptions (Always shown for Users, also accessible to Blockers) ── */}
      {!isBlocker && (
        <>
          <Card className="rounded-[12px] border-brand-line bg-white shadow-xs p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <Star className="w-5 h-5 text-brand-green fill-brand-green" />
                <div>
                  <CardTitle className="text-xl font-bold text-brand-ink">
                    VIP Room Membership
                  </CardTitle>
                  <p className="text-xs text-brand-ink-soft mt-0.5">
                    See hidden, below-market & pre-launch properties 7 days before the public and unlock VIP deal contacts for free.
                  </p>
                </div>
              </div>
              <Link
                to="/vip-room"
                className="text-xs font-bold text-brand-green hover:underline"
              >
                Open VIP Room →
              </Link>
            </div>

            <div className="p-4 rounded-[10px] bg-brand-bg-soft border border-brand-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-brand-green mb-1">
                  {isVipActive ? "Active VIP Membership" : "VIP Status"}
                </div>
                <div className="text-lg font-bold text-brand-ink">
                  {isVipActive
                    ? vipRecord?.plan?.includes("WEEK") || vipRecord?.period === "WEEK"
                      ? "Weekly VIP Room Member"
                      : "Monthly VIP Room Member"
                    : "No Active VIP Membership"}
                </div>
                <p className="text-xs text-brand-ink-soft mt-0.5">
                  {isVipActive && vipExpires ? (
                    <>
                      Active until <strong>{vipExpires}</strong>
                    </>
                  ) : (
                    "Subscribe via MTN Mobile Money to unlock the VIP Room and free VIP contact reveals."
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    openMoMo?.({
                      kind: "subscription-vip_room_weekly",
                      amount: settings?.vipRoomWeekly || 2500,
                      title: "VIP Room Membership (Weekly)",
                      listingId: null,
                    })
                  }
                  className="rounded-[9px] font-semibold text-xs sm:text-sm"
                >
                  {isVipActive ? "Extend Weekly" : "VIP Weekly"} (
                  {Number(settings?.vipRoomWeekly || 2500).toLocaleString()} RWF)
                </Button>
                <Button
                  variant="default"
                  onClick={() =>
                    openMoMo?.({
                      kind: "subscription-vip_room_monthly",
                      amount: settings?.vipRoomMonthly || 8000,
                      title: "VIP Room Membership (Monthly)",
                      listingId: null,
                    })
                  }
                  className="rounded-[9px] font-semibold text-xs sm:text-sm"
                >
                  {isVipActive ? "Extend Monthly" : "VIP Monthly"} (
                  {Number(settings?.vipRoomMonthly || 8000).toLocaleString()} RWF)
                </Button>
              </div>
            </div>
          </Card>

          <Card className="rounded-[12px] border-brand-line bg-white shadow-xs p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5">
              <Unlock className="w-5 h-5 text-brand-green" />
              <div>
                <CardTitle className="text-xl font-bold text-brand-ink">
                  Unlimited Contact Unlock Pass
                </CardTitle>
                <p className="text-xs text-brand-ink-soft mt-0.5">
                  Reveal Blocker and Owner phone numbers on any public listing without paying per-listing unlock fees.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-[10px] bg-brand-bg-soft border border-brand-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-brand-green mb-1">
                  {isPassActive ? "Active Unlock Pass" : "Pass Status"}
                </div>
                <div className="text-lg font-bold text-brand-ink">
                  {isPassActive
                    ? passRecord?.plan?.includes("WEEK") || passRecord?.period === "WEEK"
                      ? "Weekly Unlimited Unlock Pass"
                      : "Monthly Unlimited Unlock Pass"
                    : "No Active Unlock Pass"}
                </div>
                <p className="text-xs text-brand-ink-soft mt-0.5">
                  {isPassActive && passExpires ? (
                    <>
                      Active until <strong>{passExpires}</strong>
                    </>
                  ) : (
                    "Get unlimited contact reveals across all listings on Guraaha."
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    openMoMo?.({
                      kind: "subscription-unlock_pass_weekly",
                      amount: settings?.unlockPassWeekly || 1000,
                      title: "Unlimited Contact Unlock Pass (Weekly)",
                      listingId: null,
                    })
                  }
                  className="rounded-[9px] font-semibold text-xs sm:text-sm"
                >
                  {isPassActive ? "Extend Weekly" : "Pass Weekly"} (
                  {Number(settings?.unlockPassWeekly || 1000).toLocaleString()} RWF)
                </Button>
                <Button
                  variant="default"
                  onClick={() =>
                    openMoMo?.({
                      kind: "subscription-unlock_pass_monthly",
                      amount: settings?.unlockPassMonthly || 3500,
                      title: "Unlimited Contact Unlock Pass (Monthly)",
                      listingId: null,
                    })
                  }
                  className="rounded-[9px] font-semibold text-xs sm:text-sm"
                >
                  {isPassActive ? "Extend Monthly" : "Pass Monthly"} (
                  {Number(settings?.unlockPassMonthly || 3500).toLocaleString()} RWF)
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};