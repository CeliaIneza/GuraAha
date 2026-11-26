import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { listingsApi } from '../api/listings';
import { blockersApi } from '../api/blockers';
import { subscriptionsApi } from '../api/subscriptions';
import { authApi } from '../api/auth';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '../components/ui/sidebar';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { MyPropertiesTab } from '../components/dashboard/MyPropertiesTab';
import { AddPropertyTab } from '../components/dashboard/AddPropertyTab';
import { SubscriptionTab } from '../components/dashboard/SubscriptionTab';
import {
  LayoutDashboard,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  UserCog,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, syncRole } = useAuth();
  const { subscriptionTimestamp, t } = useApp();

  const [activeTab, setActiveTab] = useState(
    user?.role === 'USER' ? 'profile' : 'listings'
  );
  const [myListings, setMyListings] = useState([]);
  const [application, setApplication] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState('');

  // Profile & Password form state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
    phone: '',
    email: '',
    areaText: '',
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
      setProfileForm((prev) => ({
        ...prev,
        fullName: `${fn} ${ln}`.trim(),
        username: user.username || prev.username || '',
        phone: user.phone || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const loadMyListings = async () => {
    try {
      const { data } = await listingsApi.getMine();
      setMyListings(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Application + listings
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const appRes = await blockersApi.me().catch(() => ({ data: null }));
        if (cancelled) return;
        setApplication(appRes.data);
        if (appRes.data?.area_text || appRes.data?.sector_name) {
          setProfileForm((prev) => ({
            ...prev,
            areaText:
              appRes.data.area_text ||
              [appRes.data.sector_name, appRes.data.district_name].filter(Boolean).join(', '),
          }));
        }
        if (user?.role === 'USER' && appRes.data?.status === 'APPROVED') {
          await syncRole();
          return;
        }
        if (user?.role === 'BLOCKER' || appRes.data?.status === 'APPROVED') {
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
    if (!user) return;
    subscriptionsApi
      .getStatus()
      .then(({ data }) => setSubscription(data || null))
      .catch(() => setSubscription(null));
  }, [user, subscriptionTimestamp]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSubmittedMsg('');
    setError('');
  };

  const handlePropertyAdded = (listings) => {
    setMyListings(listings);
    setSubmittedMsg('Property listing successfully submitted for verification.');
    setActiveTab('listings');
  };

  const handleToggleListingDisabled = async (id) => {
    try {
      const { data } = await listingsApi.toggleDisabled(id);
      setSubmittedMsg(
        data?.is_disabled
          ? 'Listing disabled and hidden from public site.'
          : 'Listing enabled and visible on public site.'
      );
      await loadMyListings();
    } catch (err) {
      setError(err.message || 'Failed to toggle listing status');
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await listingsApi.delete(id);
      setSubmittedMsg('Listing removed.');
      await loadMyListings();
    } catch (err) {
      setError(err.message || 'Failed to delete listing');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSubmittedMsg('');
    setSavingProfile(true);
    try {
      const parts = profileForm.fullName.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || firstName;
      await authApi.updateProfile({
        firstName,
        lastName,
        username: profileForm.username.trim().toLowerCase(),
        phone: profileForm.phone.trim(),
        email: profileForm.email.trim(),
        areaText: profileForm.areaText.trim(),
      });
      await syncRole();
      setSubmittedMsg('✅ Profile saved.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSubmittedMsg('');
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
      setSubmittedMsg('✅ Your password has been updated.');
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setSavingPwd(false);
    }
  };

  const isBlocker = user?.role === 'BLOCKER' || application?.status === 'APPROVED';

  const blockerNav = isBlocker
    ? [
        {
          id: 'listings',
          label: t('dash_my_listings') || 'My Properties',
          icon: LayoutDashboard,
          badge: myListings.length,
        },
        { id: 'add', label: t('dash_post_title') || 'Add New Property', icon: PlusCircle },
        { id: 'subscription', label: 'Pro Subscription', icon: CreditCard },
        { id: 'profile', label: t('dash_profile_btn') || 'Profile & Password', icon: UserCog },
      ]
    : [
        { id: 'profile', label: t('dash_profile_btn') || 'Profile & Password', icon: UserCog },
        { id: 'subscription', label: 'VIP Subscription', icon: CreditCard },
      ];

  const verificationCode =
    application?.verification_code || application?.verificationCode || null;

  return (
    <SidebarProvider defaultOpen={true} className="h-full min-h-0">
      <div className="flex h-full w-full overflow-hidden bg-dashboard">
        <DashboardSidebar
          role={isBlocker ? 'BLOCKER' : 'USER'}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          customNavItems={blockerNav}
          verificationCode={isBlocker ? verificationCode || 'PENDING' : undefined}
        />

        <SidebarInset className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto bg-dashboard">
          {/* Mobile sidebar trigger only when sidebar is collapsed on phone */}
          <div className="md:hidden p-3 bg-white border-b border-brand-line flex items-center gap-2">
            <SidebarTrigger className="h-9 w-9 rounded-[9px] border border-brand-line hover:bg-brand-bg-soft" />
            <span className="text-sm font-bold text-brand-ink">
              {isBlocker ? 'Blocker Dashboard' : 'My Account & Profile'}
            </span>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
            {/* Temporary Password Banner */}
            {(user?.mustChangePassword || user?.must_change_password) && (
              <div className="p-4 rounded-[12px] bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-amber-900">
                  <strong>🔑 Temporary password active:</strong> You are signed in with a temporary
                  password set by the Admin. Please choose a personal password now.
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('profile')}
                  className="px-3.5 py-1.5 rounded-[8px] bg-brand-green text-white text-xs font-bold cursor-pointer"
                >
                  Change password
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-red-50/90 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}
            {submittedMsg && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-[9px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{submittedMsg}</span>
              </div>
            )}

            {activeTab === 'listings' && (
              <MyPropertiesTab
                listings={myListings}
                subscription={subscription}
                onNavigate={handleTabChange}
                onToggleDisabled={handleToggleListingDisabled}
                onDelete={handleDeleteListing}
              />
            )}

            {activeTab === 'add' &&
              (subscription?.blockerSubscription?.isActive ? (
                <AddPropertyTab
                  onCancel={() => handleTabChange('listings')}
                  onSuccess={handlePropertyAdded}
                />
              ) : (
                <div className="bg-white border-2 border-amber-300 rounded-[14px] p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-lg">
                      🔒
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-brand-ink">
                        Blocker Pro Subscription Required
                      </h3>
                      <p className="text-xs sm:text-sm text-brand-ink-soft mt-1 leading-relaxed">
                        You must first subscribe to a <strong>Blocker Pro</strong> plan (Weekly or Monthly) before you can add and publish property listings on Guraaha.
                      </p>
                    </div>
                  </div>
                  <SubscriptionTab subscription={subscription} isBlocker={true} />
                </div>
              ))}

            {activeTab === 'subscription' && (
              <SubscriptionTab subscription={subscription} isBlocker={isBlocker} />
            )}

            {activeTab === 'profile' && (
              <div className="bg-white border border-brand-line rounded-[14px] p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-brand-ink">
                    👤 {t('dash_profile_title')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Profile Details Form */}
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-brand-green-dark">
                      Profile details
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-ink mb-1">
                        {t('blocker_fullname')}
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
                          {t('blocker_phone')}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-ink mb-1">
                          {t('blocker_email')}
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
                      <div>
                        <label className="block text-xs font-semibold text-brand-ink mb-1">
                          {t('blocker_area')}
                        </label>
                        <input
                          type="text"
                          value={profileForm.areaText}
                          onChange={(e) =>
                            setProfileForm((p) => ({ ...p, areaText: e.target.value }))
                          }
                          className="w-full h-11 px-3.5 rounded-[9px] border border-brand-line bg-white text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm cursor-pointer transition-colors"
                    >
                      {savingProfile ? 'Saving…' : t('dash_save_profile')}
                    </button>
                  </form>

                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-brand-green-dark">
                      🔑 {t('dash_change_pwd')}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-ink mb-1">
                        {t('dash_cur_pwd')}
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
                          {t('dash_new_pwd')}
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
                          {t('dash_rep_pwd')}
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
                      {savingPwd ? 'Updating…' : t('dash_update_pwd')}
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