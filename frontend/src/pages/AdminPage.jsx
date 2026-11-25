import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { blockersApi } from '../api/blockers';
import { listingsApi } from '../api/listings';
import { settingsApi } from '../api/settings';
import { adminApi } from '../api/admin';
import { authApi } from '../api/auth';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '../components/ui/sidebar';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Button } from '../components/ui/button';
import { AdminStats } from '../components/admin/AdminStats';
import { isSubActive } from '../components/admin/AdminShared';
import { OverviewTab } from '../components/admin/OverviewTab';
import { BlockersTab } from '../components/admin/BlockersTab';
import { ListingsTab } from '../components/admin/ListingsTab';
import { VipPromotionsTab } from '../components/admin/VipPromotionsTab';
import { CategoriesTab } from '../components/admin/CategoriesTab';
import { NewsTab } from '../components/admin/NewsTab';
import { PaymentsTab } from '../components/admin/PaymentsTab';
import { LocationsTab } from '../components/admin/LocationsTab';
import { SubscriptionsTab } from '../components/admin/SubscriptionsTab';
import { PartnersTab } from '../components/admin/PartnersTab';
import { SettingsTab } from '../components/admin/SettingsTab';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Star,
  Layers,
  Newspaper,
  CreditCard,
  MapPin,
  Briefcase,
  Settings,
  UserCog,
  RefreshCw,
  Check,
  AlertTriangle,
} from 'lucide-react';

const TAB_TITLES = {
  overview: 'Admin Overview & Analytics',
  blockers: 'Blocker Applications & Accounts',
  listings: 'Property Listings Management',
  vip: 'VIP Room Promotions',
  categories: 'Property Categories & Sub-Types',
  news: 'News & Push Notifications',
  payments: 'MoMo Payments & Revenue',
  subscriptions: 'VIP & Pro Subscriptions',
  partners: 'Certified Partners',
  locations: 'Locations & Area Investment Pages',
  settings: 'Platform Settings & Fees',
  profile: 'Admin Profile & Password',
};

export const AdminDashboardPage = () => {
  const { user, syncRole } = useAuth();
  const { refreshSettings, categories, t } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [allBlockers, setAllBlockers] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settingsList, setSettingsList] = useState([]);
  const [editingSettings, setEditingSettings] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState(null);
  const [error, setError] = useState('');

  // Admin Profile & Password state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
    phone: '',
    email: '',
  });
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      const fn = user.firstName || user.first_name || '';
      const ln = user.lastName || user.last_name || '';
      setProfileForm({
        fullName: `${fn} ${ln}`.trim(),
        username: user.username || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSavingProfile(true);
    try {
      const parts = profileForm.fullName.trim().split(/\s+/);
      const firstName = parts[0] || 'Admin';
      const lastName = parts.slice(1).join(' ') || firstName;
      await authApi.updateProfile({
        firstName,
        lastName,
        username: profileForm.username.trim().toLowerCase(),
        phone: profileForm.phone.trim(),
        email: profileForm.email.trim(),
      });
      await syncRole();
      showToast('✅ Admin profile updated.');
    } catch (err) {
      setError(err.message || 'Failed to update admin profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangeAdminPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!pwdForm.currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (!pwdForm.newPassword || pwdForm.newPassword.length < 4) {
      setError('New password must be at least 4 characters.');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setError('The two new passwords do not match.');
      return;
    }
    setSavingPwd(true);
    try {
      await authApi.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      await syncRole();
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('✅ Admin password updated.');
    } catch (err) {
      setError(err.message || 'Failed to update admin password');
    } finally {
      setSavingPwd(false);
    }
  };

  /* ---------- Loaders ---------- */
  const loadData = async () => {
    setDataLoading(true);
    setError('');
    try {
      const [blockersRes, listingsRes, logsRes, paymentsRes] = await Promise.all([
        adminApi.getAllBlockers().catch(() => ({ data: [] })),
        adminApi.getAllListings().catch(() => ({ data: [] })),
        adminApi.getAuditLogs().catch(() => ({ data: [] })),
        adminApi.getAllPayments().catch(() => ({ data: [] })),
      ]);
      setAllBlockers(blockersRes.data || []);
      setAllListings(listingsRes.data || []);
      setAuditLogs(logsRes.data || []);
      setAllPayments(paymentsRes.data || []);
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
      showToast(err.message || 'Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const refreshAll = () => {
    loadData();
    loadSubscriptions();
    loadSettings();
    refreshSettings?.();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (
      activeTab === 'overview' ||
      activeTab === 'blockers' ||
      activeTab === 'listings' ||
      activeTab === 'vip'
    ) {
      loadData();
    } else if (activeTab === 'subscriptions') {
      loadSubscriptions();
    } else if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab]);

  /* ---------- Blocker actions ---------- */
  const handleApproveBlocker = async (id) => {
    try {
      const { data } = await blockersApi.approve(id);
      showToast(
        `Approved. Code: ${data?.verification_code || data?.verificationCode || 'issued'}`
      );
      loadData();
      refreshSettings?.();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleRejectBlocker = async (id) => {
    const reason = window.prompt(
      'Reason for rejecting / removing blocker from public:',
      'Removed by administrator'
    );
    if (!reason) return;
    try {
      await blockersApi.reject(id, reason);
      showToast('Blocker removed from active status.');
      loadData();
      refreshSettings?.();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleSuspendBlocker = async (id) => {
    try {
      const { data } = await blockersApi.suspend(id);
      showToast(
        data?.status === 'SUSPENDED'
          ? 'Blocker suspended and listings hidden from public.'
          : 'Blocker reactivated.'
      );
      loadData();
      refreshSettings?.();
    } catch (err) {
      showToast(err.message || 'Failed to toggle suspension');
    }
  };

  const handleReviseBlocker = async (id) => {
    const note = window.prompt('Revision note:');
    if (!note) return;
    try {
      await adminApi.reviseBlocker(id, note);
      showToast('Revision requested');
      loadData();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleDeleteBlocker = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this blocker? (Note: Blockers who still own listings cannot be deleted until their listings are removed).'
      )
    ) {
      return;
    }
    try {
      await blockersApi.delete(id);
      showToast('Blocker deleted permanently.');
      loadData();
      refreshSettings?.();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleCreateBlocker = async (form) => {
    try {
      await blockersApi.adminCreate(form);
      showToast(
        `Blocker account created! Username: ${form.username} | Password: ${form.password}`
      );
      loadData();
      refreshSettings?.();
    } catch (err) {
      showToast(err.message || 'Failed to create blocker account');
    }
  };

  const handleResetBlockerPassword = async (app) => {
    const num = Math.floor(1000 + Math.random() * 9000);
    const suggested = `Guraaha@${num}`;
    const newPassword = window.prompt(
      `Enter a temporary password for ${app.first_name || ''} ${app.last_name || ''} (${
        app.username || app.phone
      }):`,
      suggested
    );
    if (!newPassword || newPassword.trim().length < 4) return;
    try {
      await blockersApi.adminResetPassword(app.id, {
        newPassword: newPassword.trim(),
        mustChangePassword: true,
      });
      showToast(`Temporary password set to: ${newPassword.trim()}`);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to reset password');
    }
  };

  /* ---------- Listing actions ---------- */
  const handleApproveListing = async (id) => {
    try {
      await listingsApi.approve(id);
      showToast('Listing approved and now public.');
      loadData();
      refreshSettings?.();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleRejectListing = async (id) => {
    const reason = window.prompt(
      'Reason for rejecting / unpublishing listing:',
      'Removed from public view by admin'
    );
    if (!reason) return;
    try {
      await listingsApi.reject(id, reason);
      showToast('Listing removed from public view.');
      loadData();
      refreshSettings?.();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleReviseListing = async (id) => {
    const note = window.prompt('Revision note:');
    if (!note) return;
    try {
      await adminApi.reviseListing(id, note);
      showToast('Revision requested');
      loadData();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleToggleListingDisabled = async (id) => {
    try {
      const { data } = await listingsApi.toggleDisabled(id);
      showToast(
        data?.is_disabled
          ? 'Listing hidden from public view.'
          : 'Listing restored to public view.'
      );
      loadData();
      refreshSettings?.();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleToggleListingFeatured = async (id) => {
    try {
      const { data } = await listingsApi.toggleFeatured(id);
      showToast(
        data?.is_featured
          ? '★ Listing featured on Homepage!'
          : 'Listing removed from Featured on Homepage.'
      );
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to toggle featured status');
    }
  };

  const handleDeleteListing = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this listing? This cannot be undone.'
      )
    ) {
      return;
    }
    try {
      await listingsApi.delete(id);
      showToast('Listing deleted.');
      loadData();
      refreshSettings?.();
    } catch (err) {
      showToast(err.message);
    }
  };

  /* ---------- Settings action ---------- */
  const handleUpdateSetting = async (key, explicitValue, friendlyLabel) => {
    const value =
      explicitValue !== undefined
        ? String(explicitValue)
        : String(editingSettings[key] ?? '');
    if (value === undefined || value.trim() === '') {
      showToast('Value cannot be empty');
      return;
    }
    setSavingKey(key);
    try {
      await settingsApi.update(key, value);
      showToast(`${friendlyLabel || 'Setting'} saved successfully!`);
      setEditingSettings((prev) => ({ ...prev, [key]: value }));
      setSettingsList((prev) =>
        prev.map((item) => (item.key === key ? { ...item, value } : item))
      );
      refreshSettings?.();
    } catch (err) {
      showToast(err.message || 'Failed to update setting');
    } finally {
      setSavingKey(null);
    }
  };

  /* ---------- Derived ---------- */
  const adminName =
    [user?.firstName || user?.first_name, user?.lastName || user?.last_name]
      .filter(Boolean)
      .join(' ') || 'Admin';

  const pendingBlockers = allBlockers.filter((b) => b.status === 'PENDING').length;
  const approvedBlockers = allBlockers.filter((b) => b.status === 'APPROVED').length;
  const pendingListings = allListings.filter((l) => l.status === 'PENDING').length;
  const approvedListings = allListings.filter((l) => l.status === 'APPROVED').length;
  const vipPromotionsCount = allListings.filter((l) => l.is_vip || l.vip).length;
  const activeSubscriptions = allSubscriptions.filter(isSubActive).length;

  const navItems = [
    {
      id: 'overview',
      icon: LayoutDashboard,
      label: 'Overview',
    },
    {
      id: 'blockers',
      icon: Users,
      label: 'Blockers',
      badge: pendingBlockers || undefined,
    },
    {
      id: 'listings',
      icon: FileCheck,
      label: 'Listings',
      badge: pendingListings || undefined,
    },
    {
      id: 'vip',
      icon: Star,
      label: 'VIP Promotions',
      badge: vipPromotionsCount || undefined,
    },
    {
      id: 'categories',
      icon: Layers,
      label: 'Categories',
      badge: categories?.length || undefined,
    },
    {
      id: 'news',
      icon: Newspaper,
      label: 'News & Alerts',
    },
    {
      id: 'payments',
      icon: CreditCard,
      label: 'Payments',
    },
    {
      id: 'subscriptions',
      icon: CreditCard,
      label: 'Subscriptions',
      badge: activeSubscriptions || undefined,
    },
    { id: 'partners', icon: Briefcase, label: 'Partners' },
    { id: 'locations', icon: MapPin, label: 'Locations' },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
    },
    {
      id: 'profile',
      icon: UserCog,
      label: 'Profile & Password',
    },
  ];

  const statCards = [
    {
      id: 'blockers',
      label: 'Total Blockers',
      value: allBlockers.length,
      sub: `${pendingBlockers} pending`,
      icon: Users,
    },
    {
      id: 'blockers',
      label: 'Approved Blockers',
      value: approvedBlockers,
      sub: 'active agents',
      icon: Users,
    },
    {
      id: 'listings',
      label: 'Total Listings',
      value: allListings.length,
      sub: `${pendingListings} pending`,
      icon: FileCheck,
    },
    {
      id: 'listings',
      label: 'Live Listings',
      value: approvedListings,
      sub: 'visible to buyers',
      icon: FileCheck,
    },
    {
      id: 'subscriptions',
      label: 'Active Subscriptions',
      value: activeSubscriptions,
      sub: `${allSubscriptions.length} total`,
      icon: CreditCard,
    },
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
                <RefreshCw className={`w-3.5 h-3.5 ${anyLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[6px] bg-brand-pale text-brand-green border border-brand-green/20 hover:bg-brand-green hover:text-white transition-colors cursor-pointer"
                title="Edit Admin Profile & Password"
              >
                <UserCog className="w-3.5 h-3.5" />
                <span>Administrator · {adminName}</span>
              </button>
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
              onSelect={setActiveTab}
              loading={dataLoading}
            />

            {activeTab === 'overview' && (
              <OverviewTab
                blockers={allBlockers}
                listings={allListings}
                subscriptions={allSubscriptions}
                payments={allPayments}
                auditLogs={auditLogs}
              />
            )}

            {activeTab === 'blockers' && (
              <BlockersTab
                blockers={allBlockers}
                loading={dataLoading}
                onRefresh={loadData}
                onApprove={handleApproveBlocker}
                onReject={handleRejectBlocker}
                onRevise={handleReviseBlocker}
                onDelete={handleDeleteBlocker}
                onCreateBlocker={handleCreateBlocker}
                onResetPassword={handleResetBlockerPassword}
                onSuspend={handleSuspendBlocker}
              />
            )}

            {activeTab === 'listings' && (
              <ListingsTab
                listings={allListings}
                loading={dataLoading}
                onRefresh={loadData}
                onApprove={handleApproveListing}
                onReject={handleRejectListing}
                onRevise={handleReviseListing}
                onToggleDisabled={handleToggleListingDisabled}
                onToggleFeatured={handleToggleListingFeatured}
                onDelete={handleDeleteListing}
              />
            )}

            {activeTab === 'vip' && (
              <VipPromotionsTab
                listings={allListings}
                loading={dataLoading}
                onRefresh={loadData}
                showToast={showToast}
              />
            )}

            {activeTab === 'categories' && <CategoriesTab showToast={showToast} />}

            {activeTab === 'news' && <NewsTab showToast={showToast} />}

            {activeTab === 'payments' && <PaymentsTab showToast={showToast} />}

            {activeTab === 'subscriptions' && (
              <SubscriptionsTab
                subscriptions={allSubscriptions}
                loading={subLoading}
                onRefresh={loadSubscriptions}
              />
            )}

            {activeTab === 'partners' && <PartnersTab showToast={showToast} />}

            {activeTab === 'locations' && <LocationsTab showToast={showToast} />}

            {activeTab === 'settings' && (
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

            {activeTab === 'profile' && (
              <div className="bg-white border border-brand-line rounded-[14px] p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-brand-ink">
                      👤 Admin Profile & Password
                    </h3>
                    <p className="text-xs text-brand-ink-soft mt-1">
                      View and update your administrator profile details or change your password.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Profile Details Form */}
                  <form onSubmit={handleSaveAdminProfile} className="space-y-4">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-brand-green-dark">
                      Profile details
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-ink mb-1">
                        {t('blocker_fullname') || 'Full Name'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, fullName: e.target.value }))
                        }
                        className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-ink mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={profileForm.username}
                          onChange={(e) =>
                            setProfileForm((p) => ({ ...p, username: e.target.value }))
                          }
                          autoCapitalize="none"
                          className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brand-ink mb-1">
                          {t('blocker_phone') || 'Phone number'}
                        </label>
                        <input
                          type="text"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm((p) => ({ ...p, phone: e.target.value }))
                          }
                          className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-ink mb-1">
                        {t('blocker_email') || 'Email'}
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, email: e.target.value }))
                        }
                        className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm cursor-pointer transition-colors"
                    >
                      {savingProfile ? 'Saving…' : t('dash_save_profile') || 'Save profile'}
                    </button>
                  </form>

                  {/* Change Password Form */}
                  <form onSubmit={handleChangeAdminPassword} className="space-y-4">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-brand-green-dark">
                      🔑 {t('dash_change_pwd') || 'Change password'}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-ink mb-1">
                        {t('dash_cur_pwd') || 'Current password'}
                      </label>
                      <input
                        type="password"
                        value={pwdForm.currentPassword}
                        onChange={(e) =>
                          setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))
                        }
                        placeholder="••••••••"
                        className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-ink mb-1">
                          {t('dash_new_pwd') || 'New password'}
                        </label>
                        <input
                          type="password"
                          value={pwdForm.newPassword}
                          onChange={(e) =>
                            setPwdForm((p) => ({ ...p, newPassword: e.target.value }))
                          }
                          placeholder="At least 4 characters"
                          className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brand-ink mb-1">
                          {t('dash_rep_pwd') || 'Repeat new password'}
                        </label>
                        <input
                          type="password"
                          value={pwdForm.confirmPassword}
                          onChange={(e) =>
                            setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))
                          }
                          placeholder="Confirm new password"
                          className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={savingPwd}
                      className="px-5 py-2.5 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm cursor-pointer transition-colors"
                    >
                      {savingPwd ? 'Updating…' : t('dash_update_pwd') || 'Update password'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};