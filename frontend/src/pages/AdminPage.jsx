import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blockersApi } from '../api/blockers';
import { listingsApi } from '../api/listings';
import { settingsApi } from '../api/settings';
import { adminApi } from '../api/admin';
import { partnersApi } from '../api/partners';
import { listingTitle, blockerLabel } from '../utils/listing';
import {
  Shield, Users, FileCheck, ArrowLeft, Check, X, Settings,
  RefreshCw, Save, Loader2, Briefcase, Plus, Edit2, Trash2, Award,
  CreditCard,
} from 'lucide-react';

/* -- Shared status badge ----------------------------------- */
const StatusBadge = ({ status }) => {
  const map = {
    APPROVED:       'bg-green-100 text-green-800 border-green-200',
    PENDING:        'bg-amber-100 text-amber-800 border-amber-200',
    NEEDS_REVISION: 'bg-orange-100 text-orange-800 border-orange-200',
    REJECTED:       'bg-red-100 text-red-800 border-red-200',
    ACTIVE:         'bg-green-100 text-green-800 border-green-200',
    EXPIRED:        'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border whitespace-nowrap ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.replace('_', ' ') || '-'}
    </span>
  );
};

/* -- Status filter pill row --------------------------------- */
const StatusFilter = ({ counts, active, onChange }) => {
  const tabs = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION'];
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tabs.map((s) => (
        <button key={s} onClick={() => onChange(s)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${active === s ? 'bg-brand-green text-white border-brand-green' : 'border-gray-200 text-gray-500 hover:border-brand-green hover:text-brand-green'}`}>
          {s.replace('_', ' ')} {counts[s] !== undefined ? `(${counts[s]})` : ''}
        </button>
      ))}
    </div>
  );
};

/* ----------------------------------------------------------- */
export const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('blockers');
  const [allBlockers, setAllBlockers] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [settingsList, setSettingsList] = useState([]);
  const [editingSettings, setEditingSettings] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  // Status filters
  const [blockerStatusFilter, setBlockerStatusFilter] = useState('ALL');
  const [listingStatusFilter, setListingStatusFilter] = useState('ALL');

  const [toastMsg, setToastMsg] = useState(null);
  const [error, setError] = useState('');

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3500); };

  const loadData = async () => {
    setDataLoading(true);
    setError('');
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
      list.forEach((s) => { init[s.key] = s.value; });
      setEditingSettings(init);
    } catch (err) {
      showToast(err.message || 'Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadSubscriptions();
    loadSettings();
  }, []);

  const handleApproveBlocker = async (id) => {
    try {
      const { data } = await blockersApi.approve(id);
      showToast(`Approved. Code: ${data?.verification_code || data?.verificationCode || 'issued'}`);
      loadData();
    } catch (err) { showToast(err.message); }
  };

  const handleRejectBlocker = async (id) => {
    const reason = prompt('Rejection reason:', 'Incomplete application');
    if (!reason) return;
    try { await blockersApi.reject(id, reason); showToast('Blocker rejected.'); loadData(); }
    catch (err) { showToast(err.message); }
  };

  const handleApproveListing = async (id) => {
    try { await listingsApi.approve(id); showToast('Listing approved and now public.'); loadData(); }
    catch (err) { showToast(err.message); }
  };

  const handleRejectListing = async (id) => {
    const reason = prompt('Rejection reason:', 'Please re-upload clearer photos');
    if (!reason) return;
    try { await listingsApi.reject(id, reason); showToast('Listing rejected.'); loadData(); }
    catch (err) { showToast(err.message); }
  };

  const handleUpdateSetting = async (key) => {
    const value = editingSettings[key];
    if (value === undefined || value === '') { showToast('Value cannot be empty'); return; }
    setSavingKey(key);
    try {
      await settingsApi.update(key, value);
      showToast(`Setting "${key}" updated.`);
      setSettingsList((prev) => prev.map((item) => (item.key === key ? { ...item, value } : item)));
    } catch (err) { showToast(err.message || `Failed to update ${key}`); }
    finally { setSavingKey(null); }
  };

  const adminName = [user?.firstName || user?.first_name, user?.lastName || user?.last_name].filter(Boolean).join(' ') || 'Admin';

  // Counts for stat cards
  const pendingBlockers = allBlockers.filter((b) => b.status === 'PENDING').length;
  const approvedBlockers = allBlockers.filter((b) => b.status === 'APPROVED').length;
  const pendingListings = allListings.filter((l) => l.status === 'PENDING').length;
  const approvedListings = allListings.filter((l) => l.status === 'APPROVED').length;
  const activeSubscriptions = allSubscriptions.filter((s) => s.status === 'ACTIVE' && new Date(s.expires_at) > new Date()).length;

  // Filtered lists
  const visibleBlockers = blockerStatusFilter === 'ALL' ? allBlockers : allBlockers.filter((b) => b.status === 'PENDING' && blockerStatusFilter === 'PENDING' || b.status === blockerStatusFilter);
  const visibleListings = listingStatusFilter === 'ALL' ? allListings : allListings.filter((l) => l.status === listingStatusFilter);

  const blockerCounts = {
    ALL: allBlockers.length,
    PENDING: allBlockers.filter((b) => b.status === 'PENDING').length,
    APPROVED: allBlockers.filter((b) => b.status === 'APPROVED').length,
    REJECTED: allBlockers.filter((b) => b.status === 'REJECTED').length,
    NEEDS_REVISION: allBlockers.filter((b) => b.status === 'NEEDS_REVISION').length,
  };
  const listingCounts = {
    ALL: allListings.length,
    PENDING: allListings.filter((l) => l.status === 'PENDING').length,
    APPROVED: allListings.filter((l) => l.status === 'APPROVED').length,
    REJECTED: allListings.filter((l) => l.status === 'REJECTED').length,
    NEEDS_REVISION: allListings.filter((l) => l.status === 'NEEDS_REVISION').length,
  };

  const navItems = [
    { id: 'blockers', icon: Users, label: 'Blockers', badge: pendingBlockers },
    { id: 'listings', icon: FileCheck, label: 'Listings', badge: pendingListings },
    { id: 'subscriptions', icon: CreditCard, label: 'Subscriptions', badge: activeSubscriptions },
    { id: 'partners', icon: Briefcase, label: 'Partners' },
    { id: 'settings', icon: Settings, label: 'Settings', badge: settingsList.length },
  ];

  return (
    <div className="min-h-screen bg-[#fafcfa] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0F2C26] text-[#CFE0D9] p-6 flex-col justify-between flex-shrink-0">
        <div>
          <div className="pb-5 border-b border-[#1E4038] mb-6">
            <b className="text-white block text-base font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-green" /> GuraAha Admin
            </b>
            <span className="text-xs text-[#8FAF9F]">{adminName}</span>
          </div>
          <nav className="space-y-1.5 text-sm font-medium">
            {navItems.map(({ id, icon: Icon, label, badge }) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between transition-colors ${activeTab === id ? 'bg-[#1A3D35] text-white font-semibold' : 'text-[#CFE0D9] hover:bg-[#1A3D35]/60'}`}>
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-brand-green" /> {label}
                </span>
                {badge !== undefined && badge > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#0B221D] text-[#8FAF9F] font-bold">{badge}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={() => navigate('/')} className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#8FAF9F] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to public site
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 pb-20 md:pb-8">
        {toastMsg && (
          <div className="fixed top-4 right-4 z-50 bg-brand-ink text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" /> {toastMsg}
          </div>
        )}
        {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        {/* Stats */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-brand-ink">Admin Dashboard</h2>
            <button onClick={() => { loadData(); loadSubscriptions(); loadSettings(); }}
              className="px-3.5 py-2 text-xs font-semibold text-brand-ink bg-white border-2 border-gray-100 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 shadow-sm">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: 'blockers', label: 'Total Blockers', value: allBlockers.length, sub: `${pendingBlockers} pending`, icon: Users },
              { id: 'blockers', label: 'Approved Blockers', value: approvedBlockers, sub: 'active agents', icon: Users },
              { id: 'listings', label: 'Total Listings', value: allListings.length, sub: `${pendingListings} pending`, icon: FileCheck },
              { id: 'listings', label: 'Live Listings', value: approvedListings, sub: 'visible to buyers', icon: FileCheck },
              { id: 'subscriptions', label: 'Active Subscriptions', value: activeSubscriptions, sub: `${allSubscriptions.length} total`, icon: CreditCard },
            ].map((card, i) => (
              <button key={i} type="button" onClick={() => setActiveTab(card.id)}
                className={`bg-white border-2 rounded-xl p-4 text-left transition-all hover:shadow-md ${activeTab === card.id ? 'border-brand-green ring-2 ring-brand-green/20' : 'border-gray-100 hover:border-gray-200'}`}>
                <card.icon className="w-4 h-4 text-brand-green mb-2" />
                <b className="text-2xl font-extrabold text-brand-ink block">{dataLoading ? '…' : card.value}</b>
                <span className="text-xs font-semibold text-brand-ink block">{card.label}</span>
                <span className="text-xs text-brand-ink-soft">{card.sub}</span>
              </button>
            ))}
          </div>
        </section>

        {/* -- TAB: BLOCKERS -- */}
        {activeTab === 'blockers' && (
          <section className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-green" /> All Blockers ({allBlockers.length})
              </h3>
              <button onClick={loadData} disabled={dataLoading} className="p-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <StatusFilter counts={blockerCounts} active={blockerStatusFilter} onChange={setBlockerStatusFilter} />

            {dataLoading ? (
              <div className="py-12 flex items-center justify-center text-brand-ink-soft">
                <Loader2 className="w-6 h-6 animate-spin text-brand-green mr-2" /> Loading...
              </div>
            ) : visibleBlockers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brand-bg-soft text-xs font-semibold text-brand-ink-soft uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">National ID</th>
                      <th className="py-3 px-4">Area</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleBlockers.map((app) => {
                      const fullName = `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Unnamed';
                      const isPending = app.status === 'PENDING';
                      return (
                        <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-brand-ink">{fullName}</div>
                            <div className="text-xs text-brand-ink-soft">{app.phone} {app.contact_email ? `· ${app.contact_email}` : ''}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">{app.national_id || '-'}</td>
                          <td className="py-3 px-4 text-xs">{app.operating_location_name || '-'}</td>
                          <td className="py-3 px-4 text-xs text-brand-ink-soft">{app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}</td>
                          <td className="py-3 px-4"><StatusBadge status={app.status} /></td>
                          <td className="py-3 px-4 font-mono text-xs font-bold text-brand-green-dark">{app.verification_code || '-'}</td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {isPending && (
                              <>
                                <button onClick={() => handleApproveBlocker(app.id)}
                                  className="px-2.5 py-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                                <button onClick={() => { const n = window.prompt('Revision note:'); if (n) adminApi.reviseBlocker(app.id, n).then(() => { showToast('Revision requested'); loadData(); }); }}
                                  className="px-2.5 py-1.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg hover:bg-amber-200">
                                  Revise
                                </button>
                                <button onClick={() => handleRejectBlocker(app.id)}
                                  className="px-2.5 py-1.5 border border-gray-200 text-xs font-semibold rounded-lg hover:bg-red-50 hover:text-red-700 inline-flex items-center gap-1">
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            {!isPending && app.admin_note && (
                              <span className="text-xs text-gray-400 italic" title={app.admin_note}>Note: {app.admin_note.substring(0, 30)}…</span>
                            )}
                            {!isPending && app.rejection_reason && (
                              <span className="text-xs text-red-400 italic" title={app.rejection_reason}>Rejected</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-brand-ink-soft py-8 text-center bg-brand-bg-soft/50 rounded-xl">
                No blockers with status "{blockerStatusFilter}" found.
              </p>
            )}
          </section>
        )}

        {/* -- TAB: LISTINGS -- */}
        {activeTab === 'listings' && (
          <section className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-brand-green" /> All Listings ({allListings.length})
              </h3>
              <button onClick={loadData} disabled={dataLoading} className="p-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <StatusFilter counts={listingCounts} active={listingStatusFilter} onChange={setListingStatusFilter} />

            {dataLoading ? (
              <div className="py-12 flex items-center justify-center text-brand-ink-soft">
                <Loader2 className="w-6 h-6 animate-spin text-brand-green mr-2" /> Loading...
              </div>
            ) : visibleListings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brand-bg-soft text-xs font-semibold text-brand-ink-soft uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Property</th>
                      <th className="py-3 px-4">Blocker</th>
                      <th className="py-3 px-4">Owner contact</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleListings.map((l) => {
                      const title = l.title || listingTitle(l) || 'Untitled';
                      const isPending = l.status === 'PENDING';
                      const blocker = `${l.blocker_first_name || ''} ${l.blocker_last_name || ''}`.trim() || l.blocker_phone || '-';
                      const ownerPhone = l.owner_phone || l.ownerPhone;
                      const ownerName = l.owner_name || l.ownerName;
                      return (
                        <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-brand-ink">{title}</div>
                            <div className="text-xs text-brand-ink-soft font-semibold text-brand-green-dark">{Number(l.price_rwf || 0).toLocaleString()} RWF</div>
                          </td>
                          <td className="py-3 px-4 text-xs">{blocker}<br /><span className="text-brand-ink-soft">{l.blocker_phone}</span></td>
                          <td className="py-3 px-4 text-xs">
                            {ownerName && <div className="font-medium">{ownerName}</div>}
                            {ownerPhone
                              ? <span className="font-mono text-brand-green-dark">{ownerPhone}</span>
                              : <span className="text-red-500 font-semibold">⚠ No phone</span>}
                          </td>
                          <td className="py-3 px-4 text-xs text-brand-ink-soft">{l.created_at ? new Date(l.created_at).toLocaleDateString() : '-'}</td>
                          <td className="py-3 px-4"><StatusBadge status={l.status} /></td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {isPending && (
                              <>
                                <button onClick={() => handleApproveListing(l.id)}
                                  className="px-2.5 py-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                                <button onClick={() => { const n = window.prompt('Revision note:'); if (n) adminApi.reviseListing(l.id, n).then(() => { showToast('Revision requested'); loadData(); }); }}
                                  className="px-2.5 py-1.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg hover:bg-amber-200">
                                  Revise
                                </button>
                                <button onClick={() => handleRejectListing(l.id)}
                                  className="px-2.5 py-1.5 border border-gray-200 text-xs font-semibold rounded-lg hover:bg-red-50 hover:text-red-700 inline-flex items-center gap-1">
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            {!isPending && (l.admin_note || l.rejection_reason) && (
                              <span className="text-xs text-gray-400 italic max-w-[120px] truncate inline-block" title={l.admin_note || l.rejection_reason}>
                                {(l.admin_note || l.rejection_reason || '').substring(0, 25)}…
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-brand-ink-soft py-8 text-center bg-brand-bg-soft/50 rounded-xl">
                No listings with status "{listingStatusFilter}" found.
              </p>
            )}
          </section>
        )}

        {/* -- TAB: SUBSCRIPTIONS -- */}
        {activeTab === 'subscriptions' && (
          <section className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-green" /> All Subscriptions ({allSubscriptions.length})
              </h3>
              <button onClick={loadSubscriptions} disabled={subLoading} className="p-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${subLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex gap-4 mb-4 p-3 bg-brand-bg-soft rounded-xl text-sm">
              <span><b className="text-brand-green-dark">{activeSubscriptions}</b> <span className="text-brand-ink-soft">active</span></span>
              <span>·</span>
              <span><b>{allSubscriptions.filter(s => s.plan === 'weekly').length}</b> <span className="text-brand-ink-soft">weekly</span></span>
              <span>·</span>
              <span><b>{allSubscriptions.filter(s => s.plan === 'monthly').length}</b> <span className="text-brand-ink-soft">monthly</span></span>
            </div>

            {subLoading ? (
              <div className="py-12 flex items-center justify-center text-brand-ink-soft">
                <Loader2 className="w-6 h-6 animate-spin text-brand-green mr-2" /> Loading...
              </div>
            ) : allSubscriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brand-bg-soft text-xs font-semibold text-brand-ink-soft uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Blocker</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Paid (RWF)</th>
                      <th className="py-3 px-4">Starts</th>
                      <th className="py-3 px-4">Expires</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allSubscriptions.map((s) => {
                      const isActive = s.status === 'ACTIVE' && new Date(s.expires_at) > new Date();
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-semibold text-brand-ink">
                            {`${s.first_name || ''} ${s.last_name || ''}`.trim() || '-'}
                            <div className="text-xs text-brand-ink-soft">{s.phone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.plan === 'monthly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                              {s.plan?.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm font-bold text-brand-green-dark">{Number(s.amount_rwf || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-xs text-brand-ink-soft">{s.starts_at ? new Date(s.starts_at).toLocaleDateString() : '-'}</td>
                          <td className="py-3 px-4 text-xs text-brand-ink-soft">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '-'}</td>
                          <td className="py-3 px-4"><StatusBadge status={isActive ? 'ACTIVE' : 'EXPIRED'} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-brand-ink-soft py-8 text-center bg-brand-bg-soft/50 rounded-xl">No subscriptions yet.</p>
            )}
          </section>
        )}

        {/* -- TAB: PARTNERS -- */}
        {activeTab === 'partners' && <PartnersPanel showToast={showToast} />}

        {/* -- TAB: SETTINGS -- */}
        {activeTab === 'settings' && (
          <section className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-brand-ink flex items-center gap-2">
                  <Settings className="w-5 h-5 text-brand-green" /> Platform Settings & Fees
                </h3>
                <p className="text-xs text-brand-ink-soft mt-1">Manage MoMo unlock fees, blocker subscriptions, and platform pricing</p>
              </div>
              <button onClick={loadSettings} disabled={settingsLoading}
                className="px-3.5 py-2 text-xs font-semibold border-2 border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${settingsLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
            {settingsLoading && settingsList.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-brand-ink-soft">
                <Loader2 className="w-6 h-6 animate-spin text-brand-green mb-2" />
                <p className="text-xs font-medium">Loading settings...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {settingsList.map((item) => {
                  const currentValue = editingSettings[item.key] ?? item.value;
                  const isSaving = savingKey === item.key;
                  const hasChanged = String(currentValue) !== String(item.value);
                  return (
                    <div key={item.key} className="p-4 rounded-xl border-2 border-gray-100 bg-brand-bg-soft/30 hover:border-brand-green/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="max-w-md">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-brand-ink">{item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">{item.key}</span>
                        </div>
                        {item.description && <p className="text-xs text-brand-ink-soft leading-relaxed">{item.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input type="text" value={currentValue}
                          onChange={(e) => setEditingSettings((prev) => ({ ...prev, [item.key]: e.target.value }))}
                          className="w-36 px-3 py-2 text-sm font-semibold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-green bg-white text-right font-mono" />
                        <button onClick={() => handleUpdateSetting(item.key)} disabled={isSaving || !hasChanged}
                          className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${hasChanged ? 'bg-brand-green hover:bg-brand-green-dark text-white shadow-sm' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'}`}>
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0F2C26] flex md:hidden border-t border-[#1E4038] z-50">
        {navItems.map(({ id, icon: Icon, label, badge }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[9px] font-semibold relative ${activeTab === id ? 'text-white' : 'text-[#8FAF9F]'}`}>
            <Icon className="w-4 h-4" />
            {badge > 0 && <span className="absolute top-1 right-1/4 w-3.5 h-3.5 bg-amber-400 text-black text-[9px] font-extrabold rounded-full flex items-center justify-center">{badge}</span>}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   PARTNERS PANEL COMPONENT
   ========================================================================= */
const PartnersPanel = ({ showToast }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'surveyor', phone: '', email: '', descriptionEn: '', isCertified: true });

  const loadPartners = async () => {
    setLoading(true);
    try { const res = await partnersApi.getAll(); setPartners(Array.isArray(res?.data) ? res.data : []); }
    catch (err) { showToast(err.message || 'Failed to load partners'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPartners(); }, []);

  const openAdd = () => { setEditingPartner(null); setForm({ name: '', type: 'surveyor', phone: '', email: '', descriptionEn: '', isCertified: true }); setIsFormOpen(true); };
  const openEdit = (p) => { setEditingPartner(p); setForm({ name: p.name || '', type: p.type || 'surveyor', phone: p.phone || '', email: p.email || '', descriptionEn: p.description_en || p.descriptionEn || '', isCertified: p.is_certified ?? p.isCertified ?? true }); setIsFormOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const payload = { name: form.name.trim(), type: form.type, phone: form.phone.trim() || undefined, email: form.email.trim() || undefined, descriptionEn: form.descriptionEn.trim() || undefined, isCertified: Boolean(form.isCertified) };
      if (editingPartner) { await adminApi.updatePartner(editingPartner.id, payload); showToast('Partner updated.'); }
      else { await adminApi.createPartner(payload); showToast('Partner added.'); }
      setIsFormOpen(false); loadPartners();
    } catch (err) { showToast(err.message || 'Failed to save partner'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try { await adminApi.deletePartner(p.id); showToast('Partner deleted.'); loadPartners(); }
    catch (err) { showToast(err.message || 'Failed to delete'); }
  };

  return (
    <section className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-brand-ink flex items-center gap-2"><Briefcase className="w-5 h-5 text-brand-green" /> Certified Partners</h3>
          <p className="text-xs text-brand-ink-soft mt-1">Surveyors, notaries, and engineers available on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openAdd} className="px-3.5 py-2 bg-brand-green hover:bg-brand-green-dark text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Add Partner
          </button>
          <button onClick={loadPartners} disabled={loading} className="p-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      {loading && partners.length === 0 ? (
        <div className="py-12 flex items-center justify-center text-brand-ink-soft"><Loader2 className="w-6 h-6 animate-spin text-brand-green mr-2" /> Loading...</div>
      ) : partners.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg-soft text-xs font-semibold text-brand-ink-soft uppercase tracking-wider">
              <tr><th className="py-3 px-4">Partner</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">Contact</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-semibold text-brand-ink">{p.name}<div className="text-xs text-brand-ink-soft font-normal truncate max-w-xs">{p.description_en || p.descriptionEn}</div></td>
                  <td className="py-3 px-4 text-xs font-medium capitalize text-gray-700">{p.type}</td>
                  <td className="py-3 px-4 text-xs text-brand-ink-soft">{p.phone && <div>{p.phone}</div>}{p.email && <div>{p.email}</div>}</td>
                  <td className="py-3 px-4">
                    {(p.is_certified ?? p.isCertified) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><Award className="w-3 h-3" /> Certified</span>
                    ) : <span className="text-xs text-gray-400">Standard</span>}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => openEdit(p)} className="px-2.5 py-1.5 border-2 border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit</button>
                    <button onClick={() => handleDelete(p)} className="px-2.5 py-1.5 border-2 border-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-brand-ink-soft py-8 text-center bg-brand-bg-soft/50 rounded-xl">No partners yet. Click "Add Partner" to register one.</p>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-brand-ink mb-4">{editingPartner ? 'Edit Partner' : 'Add New Partner'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Name <span className="text-red-500">*</span></label>
                <input type="text" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Kigali Land Surveyors Ltd" className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green" /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Type <span className="text-red-500">*</span></label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-green">
                  {['surveyor','notary','engineer','valuer','legal'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="0788..." className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="partner@example.com" className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Description (EN)</label>
                <textarea value={form.descriptionEn} onChange={(e) => setForm((p) => ({ ...p, descriptionEn: e.target.value }))} rows={2} placeholder="Services offered..." className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green" /></div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="certifiedCheck" checked={form.isCertified} onChange={(e) => setForm((p) => ({ ...p, isCertified: e.target.checked }))} className="h-4 w-4 accent-brand-green rounded" />
                <label htmlFor="certifiedCheck" className="text-xs font-medium text-gray-700 cursor-pointer">Certified partner badge</label>
              </div>
              <div className="pt-3 flex gap-2">
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green-dark text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                  {submitting ? 'Saving…' : editingPartner ? 'Save Changes' : 'Create Partner'}
                </button>
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
