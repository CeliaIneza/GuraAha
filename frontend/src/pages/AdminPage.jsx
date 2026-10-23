import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { blockersApi } from "../api/blockers";
import { listingsApi } from "../api/listings";
import { settingsApi } from "../api/settings";
import { adminApi } from "../api/admin";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "../components/ui/sidebar";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { Button } from "../components/ui/button";
import { AdminStats } from "../components/admin/AdminStats";
import { isSubActive } from "../components/admin/AdminShared";
import { BlockersTab } from "../components/admin/BlockersTab";
import { ListingsTab } from "../components/admin/ListingsTab";
import { SubscriptionsTab } from "../components/admin/SubscriptionsTab";
import { PartnersTab } from "../components/admin/PartnersTab";
import { SettingsTab } from "../components/admin/SettingsTab";
import {
  Users,
  FileCheck,
  CreditCard,
  Briefcase,
  Settings,
  RefreshCw,
  Check,
  AlertTriangle,
} from "lucide-react";

const TAB_TITLES = {
  blockers: "Blocker Applications",
  listings: "Listing Review",
  subscriptions: "Blocker Subscriptions",
  partners: "Certified Partners",
  settings: "Platform Settings & Fees",
};

export const AdminDashboardPage = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("blockers");
  const [allBlockers, setAllBlockers] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [settingsList, setSettingsList] = useState([]);
  const [editingSettings, setEditingSettings] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState(null);
  const [error, setError] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  /* ---------- Loaders ---------- */
  const loadData = async () => {
    setDataLoading(true);
    setError("");
    try {
      const [blockersRes, listingsRes] = await Promise.all([
        adminApi.getAllBlockers().catch(() => ({ data: [] })),
        adminApi.getAllListings().catch(() => ({ data: [] })),
      ]);
      setAllBlockers(blockersRes.data || []);
      setAllListings(listingsRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDataLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    setSubLoading(true);
    try {
      const res = await adminApi.getAllSubscriptions().catch(() => ({ data: [] }));
      setAllSubscriptions(res.data || []);
    } finally {
      setSubLoading(false);
    }
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await settingsApi.getAll();
      const list = Array.isArray(res?.data) ? res.data : [];
      setSettingsList(list);
      const init = {};
      list.forEach((s) => {
        init[s.key] = s.value;
      });
      setEditingSettings(init);
    } catch (err) {
      showToast(err.message || "Failed to load settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const refreshAll = () => {
    loadData();
    loadSubscriptions();
    loadSettings();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  /* ---------- Blocker actions ---------- */
  const handleApproveBlocker = async (id) => {
    try {
      const { data } = await blockersApi.approve(id);
      showToast(
        `Approved. Code: ${data?.verification_code || data?.verificationCode || "issued"}`
      );
      loadData();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleRejectBlocker = async (id) => {
    const reason = window.prompt("Rejection reason:", "Incomplete application");
    if (!reason) return;
    try {
      await blockersApi.reject(id, reason);
      showToast("Blocker rejected.");
      loadData();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleReviseBlocker = async (id) => {
    const note = window.prompt("Revision note:");
    if (!note) return;
    try {
      await adminApi.reviseBlocker(id, note);
      showToast("Revision requested");
      loadData();
    } catch (err) {
      showToast(err.message);
    }
  };

  /* ---------- Listing actions ---------- */
  const handleApproveListing = async (id) => {
    try {
      await listingsApi.approve(id);
      showToast("Listing approved and now public.");
      loadData();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleRejectListing = async (id) => {
    const reason = window.prompt("Rejection reason:", "Please re-upload clearer photos");
    if (!reason) return;
    try {
      await listingsApi.reject(id, reason);
      showToast("Listing rejected.");
      loadData();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleReviseListing = async (id) => {
    const note = window.prompt("Revision note:");
    if (!note) return;
    try {
      await adminApi.reviseListing(id, note);
      showToast("Revision requested");
      loadData();
    } catch (err) {
      showToast(err.message);
    }
  };

  /* ---------- Settings action ---------- */
  const handleUpdateSetting = async (key) => {
    const value = editingSettings[key];
    if (value === undefined || value === "") {
      showToast("Value cannot be empty");
      return;
    }
    setSavingKey(key);
    try {
      await settingsApi.update(key, value);
      showToast(`Setting "${key}" updated.`);
      setSettingsList((prev) =>
        prev.map((item) => (item.key === key ? { ...item, value } : item))
      );
    } catch (err) {
      showToast(err.message || `Failed to update ${key}`);
    } finally {
      setSavingKey(null);
    }
  };

  /* ---------- Derived ---------- */
  const adminName =
    [
      user?.firstName || user?.first_name,
      user?.lastName || user?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Admin";

  const pendingBlockers = allBlockers.filter((b) => b.status === "PENDING").length;
  const approvedBlockers = allBlockers.filter((b) => b.status === "APPROVED").length;
  const pendingListings = allListings.filter((l) => l.status === "PENDING").length;
  const approvedListings = allListings.filter((l) => l.status === "APPROVED").length;
  const activeSubscriptions = allSubscriptions.filter(isSubActive).length;

  const navItems = [
    { id: "blockers", icon: Users, label: "Blockers", badge: pendingBlockers || undefined },
    { id: "listings", icon: FileCheck, label: "Listings", badge: pendingListings || undefined },
    {
      id: "subscriptions",
      icon: CreditCard,
      label: "Subscriptions",
      badge: activeSubscriptions || undefined,
    },
    { id: "partners", icon: Briefcase, label: "Partners" },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      badge: settingsList.length || undefined,
    },
  ];

  const statCards = [
    { id: "blockers", label: "Total Blockers", value: allBlockers.length, sub: `${pendingBlockers} pending`, icon: Users },
    { id: "blockers", label: "Approved Blockers", value: approvedBlockers, sub: "active agents", icon: Users },
    { id: "listings", label: "Total Listings", value: allListings.length, sub: `${pendingListings} pending`, icon: FileCheck },
    { id: "listings", label: "Live Listings", value: approvedListings, sub: "visible to buyers", icon: FileCheck },
    { id: "subscriptions", label: "Active Subscriptions", value: activeSubscriptions, sub: `${allSubscriptions.length} total`, icon: CreditCard },
  ];

  const anyLoading = dataLoading || subLoading || settingsLoading;

  return (
    <SidebarProvider defaultOpen={true} className="h-full min-h-0">
      <div className="flex h-full w-full overflow-hidden bg-dashboard">
        <DashboardSidebar
          role="ADMIN"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          customNavItems={navItems}
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

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refreshAll}
                disabled={anyLoading}
                className="rounded-[9px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${anyLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-[6px] bg-brand-pale text-brand-green border border-brand-green/20">
                Administrator
              </span>
              <span className="text-xs font-bold text-brand-ink-soft hidden md:inline">
                {adminName}
              </span>
            </div>
          </header>

          {/* Toast */}
          {toastMsg && (
            <div className="fixed top-4 right-4 z-50 bg-brand-ink text-white px-5 py-3 rounded-[9px] shadow-2xl text-sm font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" /> {toastMsg}
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-red-50/90 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <AdminStats
              cards={statCards}
              activeTab={activeTab}
              onSelect={setActiveTab}
              loading={dataLoading}
            />

            {activeTab === "blockers" && (
              <BlockersTab
                blockers={allBlockers}
                loading={dataLoading}
                onRefresh={loadData}
                onApprove={handleApproveBlocker}
                onReject={handleRejectBlocker}
                onRevise={handleReviseBlocker}
              />
            )}

            {activeTab === "listings" && (
              <ListingsTab
                listings={allListings}
                loading={dataLoading}
                onRefresh={loadData}
                onApprove={handleApproveListing}
                onReject={handleRejectListing}
                onRevise={handleReviseListing}
              />
            )}

            {activeTab === "subscriptions" && (
              <SubscriptionsTab
                subscriptions={allSubscriptions}
                loading={subLoading}
                onRefresh={loadSubscriptions}
              />
            )}

            {activeTab === "partners" && <PartnersTab showToast={showToast} />}

            {activeTab === "settings" && (
              <SettingsTab
                settingsList={settingsList}
                editingSettings={editingSettings}
                setEditingSettings={setEditingSettings}
                savingKey={savingKey}
                loading={settingsLoading}
                onRefresh={loadSettings}
                onSave={handleUpdateSetting}
              />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};