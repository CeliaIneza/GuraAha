import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { listingsApi } from "../api/listings";
import { blockersApi } from "../api/blockers";
import { subscriptionsApi } from "../api/subscriptions";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "../components/ui/sidebar";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { MyPropertiesTab } from "../components/dashboard/MyPropertiesTab";
import { AddPropertyTab } from "../components/dashboard/AddPropertyTab";
import { SubscriptionTab } from "../components/dashboard/SubscriptionTab";
import {
  LayoutDashboard,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  CreditCard,
} from "lucide-react";

const TAB_TITLES = {
  listings: "My Property Listings",
  add: "Create New Property Listing",
  subscription: "Blocker Pro Subscription Plan",
};

// ---- Dummy defaults (replaced by API data when it loads) ----
const DUMMY_LISTINGS = [
  {
    id: "lst_1",
    titleEn: "Prime Residential Plot in Remera, Gasabo",
    type: "land",
    priceRwf: 45000000,
    sizeValue: 450,
    sizeUnit: "sqm",
    status: "APPROVED",
    ownerName: "Habimana Jean",
    ownerPhone: "+250 788 123 456",
    createdAt: new Date().toISOString(),
    photos: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80"],
  },
  {
    id: "lst_2",
    titleEn: "Modern 3-Bedroom Villa in Kimihurura",
    type: "house",
    priceRwf: 120000000,
    sizeValue: 600,
    sizeUnit: "sqm",
    status: "PENDING",
    ownerName: "Marie Claire",
    ownerPhone: "+250 788 654 321",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    photos: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80"],
  },
];

export const DashboardPage = () => {
  const { user, syncRole } = useAuth();
  const { subscriptionTimestamp } = useApp();

  const [activeTab, setActiveTab] = useState("listings");
  const [myListings, setMyListings] = useState(DUMMY_LISTINGS);
  const [application, setApplication] = useState({
    status: "APPROVED",
    verificationCode: "K7X2PM",
  });
  const [subscription, setSubscription] = useState({
    active: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const [error, setError] = useState("");
  const [submittedMsg, setSubmittedMsg] = useState("");

  // Application + listings
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const appRes = await blockersApi.me().catch(() => ({ data: null }));
        if (cancelled) return;
        setApplication(appRes.data);
        if (user?.role === "USER" && appRes.data?.status === "APPROVED") {
          await syncRole();
          return;
        }
        if (user?.role === "BLOCKER") {
          const { data } = await listingsApi.getMine();
          if (!cancelled) setMyListings(data || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.role, syncRole]);

  // Subscription status
  useEffect(() => {
    if (user?.role !== "BLOCKER") return;
    subscriptionsApi
      .getStatus()
      .then(({ data }) => setSubscription(data || null))
      .catch(() => setSubscription(null));
  }, [user?.role, subscriptionTimestamp]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSubmittedMsg("");
    setError("");
  };

  const handlePropertyAdded = (listings) => {
    setMyListings(listings);
    setSubmittedMsg("Property listing successfully submitted for verification.");
    setActiveTab("listings");
  };

  const blockerNav = [
    { id: "listings", label: "My Properties", icon: LayoutDashboard, badge: myListings.length },
    { id: "add", label: "Add New Property", icon: PlusCircle },
    { id: "subscription", label: "Pro Subscription", icon: CreditCard },
  ];

  const verificationCode =
    application?.verification_code || application?.verificationCode;

  return (
    <SidebarProvider defaultOpen={true} className="h-full min-h-0">
      <div className="flex h-full w-full overflow-hidden bg-dashboard">
        <DashboardSidebar
          role="BLOCKER"
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          customNavItems={blockerNav}
          verificationCode={verificationCode || "K7X2PM"}
        />

        <SidebarInset className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto bg-dashboard">
          {/* Top bar */}
          <header className="h-14 border-b border-brand-line bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-[9px] border border-brand-line hover:bg-brand-bg-soft" />
              <div className="h-4 w-px bg-brand-line hidden sm:block" />
              <span className="text-sm font-bold text-brand-ink">
                {TAB_TITLES[activeTab]}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-[6px] bg-brand-pale text-brand-green border border-brand-green/20">
              <Calendar className="w-3.5 h-3.5 text-brand-green shrink-0" />
              <span>
                Subscription Active until{" "}
                {new Date(
                  subscription?.expires_at || subscription?.expiresAt || Date.now() + 2592000000
                ).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-[6px] bg-brand-pale text-brand-green border border-brand-green/20">
                Verified Blocker
              </span>
              <span className="text-xs font-mono font-bold text-brand-ink-soft hidden sm:inline">
                {verificationCode || "BLK002"}
              </span>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-red-50/90 border border-red-200 text-red-700 text-xs sm:text-sm font-medium animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}
            {submittedMsg && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{submittedMsg}</span>
              </div>
            )}

            {activeTab === "listings" && (
              <MyPropertiesTab listings={myListings} onNavigate={handleTabChange} />
            )}

            {activeTab === "add" && (
              <AddPropertyTab
                onCancel={() => handleTabChange("listings")}
                onSuccess={handlePropertyAdded}
              />
            )}

            {activeTab === "subscription" && (
              <SubscriptionTab subscription={subscription} />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};