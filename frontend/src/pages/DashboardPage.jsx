import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { listingsApi } from '../api/listings';
import { blockersApi } from '../api/blockers';
import { subscriptionsApi } from '../api/subscriptions';
import { LocationCascade } from '../components/LocationCascade';
import { formatStatus, listingLocationLine, listingTitle } from '../utils/listing';
import { LayoutDashboard, PlusCircle, ArrowLeft, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

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
        if (user.role === 'USER' && appRes.data?.status === 'APPROVED') {
          await syncRole();
          return;
        }
        if (user.role === 'BLOCKER') {
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
  }, [user.role, syncRole]);

  useEffect(() => {
    if (user?.role === 'BLOCKER') {
      setSubLoading(true);
      subscriptionsApi.getMine()
        .then(({ data }) => setSubscription(data))
        .catch(() => setSubscription(null))
        .finally(() => setSubLoading(false));
    } else {
      setSubLoading(false);
    }
  }, [user?.role, subscriptionTimestamp]);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.ownerPhone.trim()) {
      setError('Owner phone number is required. Buyers pay to unlock this contact - without it they get nothing.');
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
      setSubmittedMsg('Listing submitted for admin approval.');
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
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (user.role !== 'BLOCKER') {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Blocker dashboard</h2>
        <p className="text-brand-ink-soft mb-6">
          {application?.status === 'PENDING'
            ? 'Your blocker application is waiting for admin review.'
            : application?.status === 'REJECTED'
              ? 'Your application was rejected. Contact support or apply again if allowed.'
              : 'You need an approved blocker profile before you can post listings.'}
        </p>
        <button onClick={() => navigate('/become-blocker')} className="py-2.5 px-6 bg-brand-green text-white rounded-xl font-semibold">
          Become a blocker
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafcfa] flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0F2C26] text-[#CFE0D9] p-6 flex-col justify-between flex-shrink-0">
        <div>
          <div className="pb-5 border-b border-[#1E4038] mb-6">
            <b className="text-white block text-base font-bold">{user.firstName} {user.lastName}</b>
            <span className="text-xs text-[#8FAF9F] mt-0.5 block">
              Blocker · {application?.verification_code || application?.verificationCode || 'Approved'}
            </span>
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('listings')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors ${
                activeTab === 'listings' ? 'bg-[#007A66] text-white' : 'hover:bg-[#1A3D35]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> My listings
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors ${
                activeTab === 'add' ? 'bg-[#007A66] text-white' : 'hover:bg-[#1A3D35]'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Add listing
            </button>
          </nav>
        </div>
        <button onClick={() => navigate('/')} className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#8FAF9F] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to public site
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto pb-20 md:pb-10">
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        {submittedMsg && <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{submittedMsg}</div>}

        {subLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading subscription details...
          </div>
        ) : !subscription ? (
          /* Subscription gate screen */
          <div className="max-w-xl mx-auto text-center py-12">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl"></span>
            </div>
            <h2 className="text-2xl font-bold text-brand-ink mb-3">Subscribe to post listings</h2>
            <p className="text-brand-ink-soft mb-8 leading-relaxed">
              You are an approved GuraAha Blocker. Subscribe to start adding property listings.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {/* Weekly card */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-bold text-brand-ink-soft uppercase tracking-wide mb-2">Weekly</p>
                <p className="text-3xl font-extrabold text-brand-green-dark">
                  {settings.blockerProWeekly?.toLocaleString()} <span className="text-sm font-normal">RWF</span>
                </p>
                <p className="text-xs text-brand-ink-soft mt-1 mb-4">Valid for 7 days</p>
                <button
                  onClick={() => openMoMo({ kind: 'subscription-weekly', amount: settings.blockerProWeekly, title: 'Blocker Pro Weekly', listingId: null })}
                  className="w-full py-2.5 border-2 border-brand-green text-brand-green font-semibold rounded-xl text-sm hover:bg-brand-green hover:text-white transition-all"
                >
                  Subscribe weekly
                </button>
              </div>
              {/* Monthly card */}
              <div className="bg-white border-2 border-brand-green rounded-xl p-5 shadow-md">
                <p className="text-xs font-bold text-brand-green uppercase tracking-wide mb-2">Monthly - Best value</p>
                <p className="text-3xl font-extrabold text-brand-green-dark">
                  {settings.blockerProMonthly?.toLocaleString()} <span className="text-sm font-normal">RWF</span>
                </p>
                <p className="text-xs text-brand-ink-soft mt-1 mb-4">Valid for 30 days</p>
                <button
                  onClick={() => openMoMo({ kind: 'subscription-monthly', amount: settings.blockerProMonthly, title: 'Blocker Pro Monthly', listingId: null })}
                  className="w-full py-2.5 bg-brand-green text-white font-semibold rounded-xl text-sm hover:bg-brand-green-dark transition-all"
                >
                  Subscribe monthly
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Subscription active badge */}
            <div className="mb-6 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3.5 py-1.5 rounded-full font-semibold border border-green-200">
                Subscribed until {new Date(subscription.expires_at || subscription.expiresAt).toLocaleDateString()}
              </span>
            </div>

            {activeTab === 'listings' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-brand-ink">My listings</h2>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="py-2.5 px-4 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" /> Add New Property
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-white border-2 border-gray-100 rounded-xl p-5 shadow-sm">
                    <b className="text-2xl font-bold block">{myListings.length}</b>
                    <span className="text-xs text-brand-ink-soft">Your listings</span>
                  </div>
                  <div className="bg-white border-2 border-gray-100 rounded-xl p-5 shadow-sm">
                    <b className="text-2xl font-bold block">{myListings.filter((l) => l.status === 'APPROVED').length}</b>
                    <span className="text-xs text-brand-ink-soft">Live on the site</span>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-sm min-w-[500px]">
                    <thead className="bg-brand-bg-soft border-b border-gray-200 text-xs font-semibold text-brand-ink-soft">
                      <tr>
                        <th className="py-3 px-4">Property</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Price (RWF)</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {myListings.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-semibold">{listingTitle(item)}</td>
                          <td className="py-3 px-4 text-brand-ink-soft">{listingLocationLine(item)}</td>
                          <td className="py-3 px-4 font-bold text-brand-green-dark">{Number(item.priceRwf || 0).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              item.status === 'APPROVED' ? 'bg-[#E4F1EC] text-brand-green-dark'
                                : item.status === 'PENDING' ? 'bg-amber-100 text-amber-800'
                                : item.status === 'NEEDS_REVISION' ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                              {item.status === 'PENDING' && <Clock className="w-3 h-3" />}
                              {item.status === 'NEEDS_REVISION' && <AlertTriangle className="w-3 h-3" />}
                              {item.status === 'REJECTED' && <AlertTriangle className="w-3 h-3" />}
                              {formatStatus(item.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {myListings.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-brand-ink-soft">No listings yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'add' && (
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-brand-ink mb-6">Add listing</h2>
                <form onSubmit={handleAddSubmit} className="bg-white border-2 border-gray-100 rounded-xl p-6 space-y-4 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Title (EN)</label>
                      <input
                        value={form.titleEn}
                        onChange={update('titleEn')}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Title (RW)</label>
                      <input
                        value={form.titleRw}
                        onChange={update('titleRw')}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Title (FR)</label>
                      <input
                        value={form.titleFr}
                        onChange={update('titleFr')}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-brand-ink-soft">At least one title language is required.</p>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Description (EN)</label>
                    <textarea
                      value={form.descriptionEn}
                      onChange={update('descriptionEn')}
                      rows={3}
                      className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Description (RW)</label>
                      <textarea
                        value={form.descriptionRw}
                        onChange={update('descriptionRw')}
                        rows={3}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Description (FR)</label>
                      <textarea
                        value={form.descriptionFr}
                        onChange={update('descriptionFr')}
                        rows={3}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                      <select
                        value={form.type}
                        onChange={update('type')}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-green transition-colors"
                      >
                        <option value="land">Land</option>
                        <option value="house">House</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Price (RWF)</label>
                      <input
                        type="number"
                        required
                        value={form.priceRwf}
                        onChange={update('priceRwf')}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Size</label>
                      <input
                        type="number"
                        required
                        value={form.sizeValue}
                        onChange={update('sizeValue')}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Size unit</label>
                      <input
                        value={form.sizeUnit}
                        onChange={update('sizeUnit')}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2">Village (required)</label>
                    <LocationCascade required deepest="village" onChange={({ locationId }) => setForm((prev) => ({ ...prev, villageId: locationId }))} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">UPI Number</label>
                    <input
                      value={form.upiNumber}
                      onChange={update('upiNumber')}
                      className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                    />
                  </div>

                  {/* Cover photo */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2">Cover photo (required)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setForm((prev) => ({ ...prev, coverPhoto: file }));
                        if (file) setCoverPreview(URL.createObjectURL(file));
                      }}
                      className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-green file:text-white"
                    />
                    {coverPreview && (
                      <img src={coverPreview} alt="Cover" className="mt-2 w-full h-40 object-cover rounded-xl border-2 border-gray-100" />
                    )}
                  </div>

                  {/* Extra photos */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2">Additional photos (up to 4, optional)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files).slice(0, 4);
                        setForm((prev) => ({ ...prev, extraPhotos: files }));
                        setExtraPreviews(files.map((f) => URL.createObjectURL(f)));
                      }}
                      className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700"
                    />
                    {extraPreviews.length > 0 && (
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {extraPreviews.map((url, i) => (
                          <img key={i} src={url} alt={`Extra ${i + 1}`} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Owner name (hidden)</label>
                      <input
                        value={form.ownerName}
                        onChange={update('ownerName')}
                        className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
                      />
                    </div>
                  <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Owner phone <span className="text-red-500">*</span>
                        <span className="text-xs font-normal text-gray-400 ml-1">(buyers pay to unlock this)</span>
                      </label>
                      <input
                        value={form.ownerPhone}
                        onChange={update('ownerPhone')}
                        placeholder="0788 XXX XXX"
                        required
                        className={`w-full p-2.5 border-2 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors ${
                          !form.ownerPhone.trim() ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                        }`}
                      />
                      {!form.ownerPhone.trim() && (
                        <p className="text-xs text-red-600 mt-1">⚠ Required - buyers pay to see this number</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl disabled:opacity-60 transition-colors"
                  >
                    {saving ? 'Submitting…' : 'Submit for admin approval'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0F2C26] flex md:hidden border-t border-[#1E4038] z-50">
        <button
          onClick={() => setActiveTab('listings')}
          className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-[10px] font-semibold ${
            activeTab === 'listings' ? 'text-white' : 'text-[#8FAF9F]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Listings
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-[10px] font-semibold ${
            activeTab === 'add' ? 'text-white' : 'text-[#8FAF9F]'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          Add
        </button>
      </div>
    </div>
  );
};
