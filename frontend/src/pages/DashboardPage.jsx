import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { listingsApi } from '../api/listings';
import { blockersApi } from '../api/blockers';
import { subscriptionsApi } from '../api/subscriptions';
import { LocationCascade } from '../components/LocationCascade';
import { formatStatus, listingLocationLine, listingTitle } from '../utils/listing';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '../components/ui/sidebar';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  LayoutDashboard,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Building2,
  Calendar,
  CreditCard,
  Upload,
  FileText,
  X,
  Sparkles,
  Phone,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, syncRole } = useAuth();
  const { settings, openMoMo, subscriptionTimestamp } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('listings');
  const [myListings, setMyListings] = useState([]);
  const [application, setApplication] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [coverPreview, setCoverPreview] = useState(null);
  const [extraPreviews, setExtraPreviews] = useState([]);

  const [form, setForm] = useState({
    titleEn: '',
    titleRw: '',
    titleFr: '',
    descriptionEn: '',
    descriptionRw: '',
    descriptionFr: '',
    type: 'land',
    priceRwf: '',
    sizeValue: '',
    sizeUnit: 'sqm',
    villageId: '',
    upiNumber: '',
    ownerName: '',
    ownerPhone: '',
    coverPhoto: null,
    extraPhotos: [],
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const appRes = await blockersApi.me().catch(() => ({ data: null }));
        if (cancelled) return;
        setApplication(appRes.data);
        if (user?.role === 'USER' && appRes.data?.status === 'APPROVED') {
          await syncRole();
          return;
        }
        if (user?.role === 'BLOCKER') {
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

  useEffect(() => {
    if (user?.role === 'BLOCKER') {
      setSubLoading(true);
      subscriptionsApi
        .getStatus()
        .then(({ data }) => setSubscription(data || null))
        .catch(() => setSubscription(null))
        .finally(() => setSubLoading(false));
    } else {
      setSubLoading(false);
    }
  }, [user?.role, subscriptionTimestamp]);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleAddSubmit = async (e) => {
    e?.preventDefault();
    if (!form.ownerPhone.trim()) {
      setError('Owner phone number is required. Buyers pay to unlock this contact.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const { data } = await listingsApi.create({
        villageId: form.villageId,
        type: form.type,
        titleEn: form.titleEn || undefined,
        titleRw: form.titleRw || undefined,
        titleFr: form.titleFr || undefined,
        descriptionEn: form.descriptionEn || undefined,
        descriptionRw: form.descriptionRw || undefined,
        descriptionFr: form.descriptionFr || undefined,
        priceRwf: Number(form.priceRwf),
        sizeValue: Number(form.sizeValue),
        sizeUnit: form.sizeUnit,
        upiNumber: form.upiNumber || undefined,
        ownerName: form.ownerName || undefined,
        ownerPhone: form.ownerPhone || undefined,
      });

      if (form.coverPhoto) {
        await listingsApi.addPhoto(data.id, form.coverPhoto, 0);
      }
      const extras = form.extraPhotos || [];
      await Promise.all(extras.map((file, idx) => listingsApi.addPhoto(data.id, file, idx + 1)));

      const { data: mine } = await listingsApi.getMine();
      setMyListings(mine || []);
      setSubmittedMsg('Property listing successfully submitted for verification.');
      setActiveTab('listings');

      // Reset form
      setForm({
        titleEn: '',
        titleRw: '',
        titleFr: '',
        descriptionEn: '',
        descriptionRw: '',
        descriptionFr: '',
        type: 'land',
        priceRwf: '',
        sizeValue: '',
        sizeUnit: 'sqm',
        villageId: '',
        upiNumber: '',
        ownerName: '',
        ownerPhone: '',
        coverPhoto: null,
        extraPhotos: [],
      });
      setCoverPreview(null);
      setExtraPreviews([]);
    } catch (err) {
      setError(err.message || 'Failed to submit property listing.');
    } finally {
      setSaving(false);
    }
  };

  const [devPreview, setDevPreview] = useState(false);

  // Blocker gate screen when not a blocker
  if (user?.role !== 'BLOCKER' && !devPreview) {
    return (
      <div className="min-h-[85vh] bg-dashboard flex items-center justify-center px-4 py-16">
        <Card className="max-w-md w-full rounded-[9px] border-brand-line bg-white shadow-sm p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-7 h-7 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">Blocker Portal</h2>
            <p className="text-sm text-brand-ink-soft leading-relaxed mt-2">
              {application?.status === 'PENDING'
                ? 'Your blocker application is currently undergoing compliance review. You will be notified via SMS upon approval.'
                : application?.status === 'REJECTED'
                ? 'Your previous application was not approved. Please verify your National ID and re-apply.'
                : 'You need an approved blocker profile before you can publish properties on GuraAha.'}
            </p>
          </div>
          <div className="pt-2 space-y-2">
            <Button
              onClick={() => navigate('/become-blocker')}
              className="w-full h-11 rounded-[9px] font-semibold text-base shadow-sm"
            >
              Become a Blocker
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDevPreview(true)}
              className="w-full h-10 rounded-[9px] text-xs font-medium border-dashed border-gray-300 text-gray-600 hover:text-brand-green"
            >
              Preview Blocker Dashboard (UI Test Mode)
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const blockerNav = [
    { id: 'listings', label: 'My Properties', icon: LayoutDashboard, badge: myListings.length },
    { id: 'add', label: 'Add New Property', icon: PlusCircle },
    { id: 'subscription', label: 'Pro Subscription', icon: CreditCard },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-dashboard">
        {/* Shared Dashboard Sidebar */}
        <DashboardSidebar
          role="BLOCKER"
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSubmittedMsg('');
            setError('');
          }}
          customNavItems={blockerNav}
          verificationCode={application?.verification_code || application?.verificationCode || 'K7X2PM'}
        />

        {/* Dashboard Main Inset */}
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-dashboard">
          {/* Top Inset Bar */}
          <header className="h-14 border-b border-brand-line bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-[9px] border border-brand-line hover:bg-brand-bg-soft" />
              <div className="h-4 w-px bg-brand-line hidden sm:block" />
              <span className="text-sm font-semibold text-brand-ink">
                {activeTab === 'listings' && 'My Property Listings'}
                {activeTab === 'add' && 'Create New Property Listing'}
                {activeTab === 'subscription' && 'Blocker Pro Subscription Plan'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-[6px] bg-brand-pale text-brand-green border border-brand-green/20">
                Verified Blocker
              </span>
              <span className="text-xs font-mono text-brand-ink-soft hidden sm:inline">
                {application?.verification_code || application?.verificationCode || 'K7X2PM'}
              </span>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
            {/* Feedback Notifications */}
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

            {subLoading ? (
              <div className="flex items-center justify-center py-20 text-brand-ink-soft gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-brand-green" />
                <span className="text-sm font-medium">Loading subscription details…</span>
              </div>
            ) : !subscription ? (
              /* Subscription Gate Screen */
              <Card className="rounded-[9px] border-brand-line bg-white shadow-sm p-6 sm:p-10 text-center max-w-2xl mx-auto space-y-6">
                <div className="w-14 h-14 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CreditCard className="w-7 h-7 text-brand-green" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-brand-ink">
                    Subscribe to Post Listings
                  </CardTitle>
                  <CardDescription className="text-sm text-brand-ink-soft mt-1.5 max-w-md mx-auto leading-relaxed">
                    You are an approved GuraAha Blocker. Activate a subscription pass to publish and manage land and house listings.
                  </CardDescription>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
                  {/* Weekly Card */}
                  <Card className="rounded-[9px] border-brand-line p-5 bg-white shadow-xs flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-brand-ink-soft uppercase tracking-wider mb-2">
                        Weekly Pass
                      </p>
                      <p className="text-3xl font-extrabold text-brand-green">
                        {settings?.blockerProWeekly?.toLocaleString() || '1,500'}{' '}
                        <span className="text-sm font-normal text-brand-ink-soft">RWF</span>
                      </p>
                      <p className="text-xs text-brand-ink-soft mt-1 mb-4">Valid for 7 days</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        openMoMo?.({
                          kind: 'subscription-weekly',
                          amount: settings?.blockerProWeekly || 1500,
                          title: 'Blocker Pro Weekly',
                          listingId: null,
                        })
                      }
                      className="w-full rounded-[9px] font-semibold border-brand-line hover:border-brand-green hover:text-brand-green"
                    >
                      Subscribe Weekly
                    </Button>
                  </Card>

                  {/* Monthly Card */}
                  <Card className="rounded-[9px] border-brand-green bg-brand-bg-soft/40 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider bg-brand-green text-white px-2 py-0.5 rounded-[5px]">
                      Best Value
                    </span>
                    <div>
                      <p className="text-xs font-bold text-brand-green uppercase tracking-wider mb-2">
                        Monthly Pass
                      </p>
                      <p className="text-3xl font-extrabold text-brand-green">
                        {settings?.blockerProMonthly?.toLocaleString() || '5,000'}{' '}
                        <span className="text-sm font-normal text-brand-ink-soft">RWF</span>
                      </p>
                      <p className="text-xs text-brand-ink-soft mt-1 mb-4">Valid for 30 full days</p>
                    </div>
                    <Button
                      variant="default"
                      onClick={() =>
                        openMoMo?.({
                          kind: 'subscription-monthly',
                          amount: settings?.blockerProMonthly || 5000,
                          title: 'Blocker Pro Monthly',
                          listingId: null,
                        })
                      }
                      className="w-full rounded-[9px] font-semibold shadow-xs"
                    >
                      Subscribe Monthly
                    </Button>
                  </Card>
                </div>
              </Card>
            ) : (
              <>
                {/* Active Subscription Badge */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-[9px] bg-brand-pale text-brand-green border border-brand-green/20">
                    <Calendar className="w-3.5 h-3.5 text-brand-green" />
                    <span>
                      Subscription Active until{' '}
                      {new Date(
                        subscription.expires_at || subscription.expiresAt || Date.now() + 2592000000
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  {activeTab === 'listings' && (
                    <Button
                      onClick={() => setActiveTab('add')}
                      variant="default"
                      className="rounded-[9px] font-semibold text-xs sm:text-sm h-10 px-4 flex items-center gap-1.5 shadow-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add New Property</span>
                    </Button>
                  )}
                </div>

                {/* Tab: Listings View */}
                {activeTab === 'listings' && (
                  <div className="space-y-6">
                    {/* Reusable Metric Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="rounded-[9px] border-brand-line p-5 bg-white shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-brand-ink-soft uppercase tracking-wider">
                            Total Properties
                          </span>
                          <Building2 className="w-4 h-4 text-brand-green" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold text-brand-ink">
                            {myListings.length}
                          </span>
                          <span className="text-xs text-brand-ink-soft">posted by you</span>
                        </div>
                      </Card>

                      <Card className="rounded-[9px] border-brand-line p-5 bg-white shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-brand-ink-soft uppercase tracking-wider">
                            Live on Site
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-brand-green" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold text-brand-green">
                            {myListings.filter((l) => l.status === 'APPROVED' || !l.status).length}
                          </span>
                          <span className="text-xs text-brand-ink-soft">verified & public</span>
                        </div>
                      </Card>

                      <Card className="rounded-[9px] border-brand-line p-5 bg-white shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-brand-ink-soft uppercase tracking-wider">
                            Pending Audit
                          </span>
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold text-brand-ink">
                            {myListings.filter((l) => l.status === 'PENDING').length}
                          </span>
                          <span className="text-xs text-brand-ink-soft">under verification</span>
                        </div>
                      </Card>
                    </div>

                    {/* Listings Table Card */}
                    <Card className="rounded-[9px] border-brand-line bg-white shadow-xs overflow-hidden">
                      <div className="p-4 sm:p-5 border-b border-brand-line/60 flex items-center justify-between">
                        <h3 className="font-bold text-base text-brand-ink">Managed Properties</h3>
                        <span className="text-xs text-brand-ink-soft">
                          {myListings.length} properties total
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[600px]">
                          <thead className="bg-brand-bg-soft/60 border-b border-brand-line text-xs font-semibold text-brand-ink-soft">
                            <tr>
                              <th className="py-3 px-4">Property</th>
                              <th className="py-3 px-4">Type</th>
                              <th className="py-3 px-4">Location</th>
                              <th className="py-3 px-4">Price (RWF)</th>
                              <th className="py-3 px-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-line/60">
                            {myListings.map((item) => (
                              <tr key={item.id} className="hover:bg-brand-bg-soft/40 transition-colors">
                                <td className="py-3 px-4 font-semibold text-brand-ink">
                                  {listingTitle(item)}
                                </td>
                                <td className="py-3 px-4 capitalize text-brand-ink-soft text-xs">
                                  {item.type || 'Plot'}
                                </td>
                                <td className="py-3 px-4 text-brand-ink-soft text-xs">
                                  {listingLocationLine(item)}
                                </td>
                                <td className="py-3 px-4 font-bold text-brand-green">
                                  {Number(item.priceRwf || item.price || 0).toLocaleString()} RWF
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-[6px] ${
                                      item.status === 'APPROVED' || !item.status
                                        ? 'bg-brand-pale text-brand-green border border-brand-green/20'
                                        : item.status === 'PENDING'
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : item.status === 'NEEDS_REVISION'
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                    }`}
                                  >
                                    {(item.status === 'APPROVED' || !item.status) && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                                    )}
                                    {item.status === 'PENDING' && (
                                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                                    )}
                                    {item.status === 'NEEDS_REVISION' && (
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                                    )}
                                    {item.status === 'REJECTED' && (
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                    )}
                                    {formatStatus(item.status || 'APPROVED')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {myListings.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-12 text-center text-brand-ink-soft">
                                  <Building2 className="w-8 h-8 text-brand-line mx-auto mb-2" />
                                  <p className="font-semibold text-brand-ink">No properties listed yet.</p>
                                  <p className="text-xs text-brand-ink-soft mt-1">
                                    Click "Add New Property" to submit your first land or house listing.
                                  </p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Tab: Add Listing Form */}
                {activeTab === 'add' && (
                  <Card className="rounded-[9px] border-brand-line bg-white shadow-sm overflow-hidden">
                    <CardHeader className="p-6 sm:p-8 pb-3 border-b border-brand-line/60">
                      <CardTitle className="text-xl sm:text-2xl font-bold text-brand-ink">
                        Add Property Listing
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-brand-ink-soft leading-relaxed mt-1">
                        Submit verified land or house information. Title deeds and owner contact will be audited before publishing.
                      </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleAddSubmit}>
                      <CardContent className="p-6 sm:p-8 space-y-6">
                        {/* Multilingual Titles */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-brand-ink">
                            Property Titles <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <Input
                                value={form.titleEn}
                                onChange={update('titleEn')}
                                placeholder="Title in English"
                                className="rounded-[9px] h-10.5 text-sm"
                              />
                              <span className="text-[11px] text-brand-ink-soft mt-1 block">English</span>
                            </div>
                            <div>
                              <Input
                                value={form.titleRw}
                                onChange={update('titleRw')}
                                placeholder="Umutwe mu Kinyarwanda"
                                className="rounded-[9px] h-10.5 text-sm"
                              />
                              <span className="text-[11px] text-brand-ink-soft mt-1 block">Kinyarwanda</span>
                            </div>
                            <div>
                              <Input
                                value={form.titleFr}
                                onChange={update('titleFr')}
                                placeholder="Titre en Français"
                                className="rounded-[9px] h-10.5 text-sm"
                              />
                              <span className="text-[11px] text-brand-ink-soft mt-1 block">Français</span>
                            </div>
                          </div>
                        </div>

                        {/* Descriptions */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-brand-ink">
                            Property Descriptions
                          </label>
                          <div className="space-y-3">
                            <textarea
                              value={form.descriptionEn}
                              onChange={update('descriptionEn')}
                              rows={2}
                              placeholder="Description in English"
                              className="w-full p-3 border border-brand-line rounded-[9px] text-sm text-brand-ink bg-white focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <textarea
                                value={form.descriptionRw}
                                onChange={update('descriptionRw')}
                                rows={2}
                                placeholder="Ibisobanuro mu Kinyarwanda"
                                className="w-full p-3 border border-brand-line rounded-[9px] text-sm text-brand-ink bg-white focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                              />
                              <textarea
                                value={form.descriptionFr}
                                onChange={update('descriptionFr')}
                                rows={2}
                                placeholder="Description en Français"
                                className="w-full p-3 border border-brand-line rounded-[9px] text-sm text-brand-ink bg-white focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Type & Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-brand-ink">
                              Property Type <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={form.type}
                              onChange={update('type')}
                              className="w-full h-11 px-3 border border-brand-line rounded-[9px] text-sm bg-white text-brand-ink focus:outline-none focus:border-brand-green"
                            >
                              <option value="land">Land</option>
                              <option value="plot">Plot</option>
                              <option value="house">House</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-brand-ink">
                              Price (RWF) <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              required
                              value={form.priceRwf}
                              onChange={update('priceRwf')}
                              placeholder="e.g. 15000000"
                              className="rounded-[9px] h-11 text-sm font-semibold"
                            />
                          </div>
                        </div>

                        {/* Size & Unit */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-brand-ink">
                              Measurement Size <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              required
                              value={form.sizeValue}
                              onChange={update('sizeValue')}
                              placeholder="e.g. 600"
                              className="rounded-[9px] h-11 text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-brand-ink">
                              Unit of Measurement
                            </label>
                            <select
                              value={form.sizeUnit}
                              onChange={update('sizeUnit')}
                              className="w-full h-11 px-3 border border-brand-line rounded-[9px] text-sm bg-white text-brand-ink focus:outline-none focus:border-brand-green"
                            >
                              <option value="sqm">Square Meters (m²)</option>
                              <option value="ha">Hectares (ha)</option>
                              <option value="ares">Ares</option>
                            </select>
                          </div>
                        </div>

                        {/* Village Cascading Selector */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-brand-ink">
                            Location (Province, District & Sector) <span className="text-red-500">*</span>
                          </label>
                          <LocationCascade
                            required
                            deepest="village"
                            onChange={({ locationId }) =>
                              setForm((prev) => ({ ...prev, villageId: locationId }))
                            }
                          />
                        </div>

                        {/* UPI Number */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-brand-ink">
                            UPI Number (Unique Parcel Identifier)
                          </label>
                          <Input
                            value={form.upiNumber}
                            onChange={update('upiNumber')}
                            placeholder="e.g. 1/02/09/04/432"
                            className="rounded-[9px] h-11 text-sm font-mono"
                          />
                        </div>

                        {/* Cover Photo */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-brand-ink">
                            Cover Photo <span className="text-red-500">*</span>
                          </label>
                          <div className="p-4 border border-dashed border-brand-line rounded-[9px] bg-brand-bg-soft/30 hover:border-brand-green/60 transition-colors">
                            <label className="flex flex-col sm:flex-row items-center gap-3 cursor-pointer">
                              <span className="w-10 h-10 rounded-[9px] bg-white border border-brand-line flex items-center justify-center text-brand-green shrink-0">
                                <Upload className="w-5 h-5 text-brand-green" />
                              </span>
                              <div className="flex-1 text-center sm:text-left">
                                <span className="text-xs font-semibold text-brand-ink block">
                                  Click to upload property cover image
                                </span>
                                <span className="text-[11px] text-brand-ink-soft">
                                  JPEG, PNG or WEBP (high-resolution recommended)
                                </span>
                              </div>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                required={!coverPreview}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setForm((prev) => ({ ...prev, coverPhoto: file }));
                                    setCoverPreview(URL.createObjectURL(file));
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                            {coverPreview && (
                              <div className="mt-3 relative w-full sm:w-60 h-36 rounded-[9px] overflow-hidden border border-brand-line">
                                <img
                                  src={coverPreview}
                                  alt="Cover preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCoverPreview(null);
                                    setForm((prev) => ({ ...prev, coverPhoto: null }));
                                  }}
                                  className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-[6px]"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Additional Photos */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-brand-ink">
                            Additional Photos <span className="text-xs font-normal text-brand-ink-soft">(up to 4, optional)</span>
                          </label>
                          <div className="p-4 border border-dashed border-brand-line rounded-[9px] bg-brand-bg-soft/30">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-brand-line rounded-[9px] text-xs font-semibold text-brand-ink hover:border-brand-green">
                              <Upload className="w-3.5 h-3.5 text-brand-green" />
                              <span>Select multiple images</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []).slice(0, 4);
                                  setForm((prev) => ({ ...prev, extraPhotos: files }));
                                  setExtraPreviews(files.map((f) => URL.createObjectURL(f)));
                                }}
                                className="hidden"
                              />
                            </label>
                            {extraPreviews.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {extraPreviews.map((url, i) => (
                                  <div key={i} className="relative h-20 rounded-[8px] overflow-hidden border border-brand-line">
                                    <img src={url} alt={`Extra ${i + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Owner Verification Details */}
                        <div className="p-4 rounded-[9px] bg-brand-bg-soft/40 border border-brand-line space-y-4">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-brand-green" />
                            <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider">
                              Owner Direct Contact (Protected)
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-brand-ink">
                                Owner Full Name <span className="text-xs font-normal text-brand-ink-soft">(Private)</span>
                              </label>
                              <Input
                                value={form.ownerName}
                                onChange={update('ownerName')}
                                placeholder="e.g. Mugisha Alex"
                                className="rounded-[9px] h-10.5 text-sm bg-white"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-brand-ink">
                                Owner Phone Number <span className="text-red-500">*</span>
                              </label>
                              <Input
                                value={form.ownerPhone}
                                onChange={update('ownerPhone')}
                                placeholder="0788 XXX XXX"
                                required
                                className="rounded-[9px] h-10.5 text-sm bg-white"
                              />
                              <p className="text-[11px] text-brand-ink-soft">
                                Buyers pay to unlock this verified contact
                              </p>
                            </div>
                          </div>
                        </div>

                      </CardContent>

                      {/* Submit Action */}
                      <CardFooter className="p-6 sm:p-8 pt-0 border-t border-brand-line/60 flex items-center justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab('listings')}
                          className="rounded-[9px]"
                        >
                          Cancel
                        </Button>

                        <Button
                          type="submit"
                          disabled={saving}
                          variant="default"
                          className="rounded-[9px] font-semibold h-11 px-6 shadow-sm flex items-center gap-2"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Submitting…</span>
                            </>
                          ) : (
                            <>
                              <span>Submit for Admin Approval</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                )}

                {/* Tab: Subscription View */}
                {activeTab === 'subscription' && (
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
                          Expires on{' '}
                          <strong>
                            {new Date(
                              subscription.expires_at || subscription.expiresAt || Date.now() + 2592000000
                            ).toLocaleDateString()}
                          </strong>
                        </p>
                      </div>

                      <Button
                        variant="default"
                        onClick={() =>
                          openMoMo?.({
                            kind: 'subscription-monthly',
                            amount: settings?.blockerProMonthly || 5000,
                            title: 'Renew Blocker Pro Monthly',
                            listingId: null,
                          })
                        }
                        className="rounded-[9px] font-semibold text-xs sm:text-sm"
                      >
                        Renew / Extend Plan
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
