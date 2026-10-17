import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsApi } from '../api/listings';
import { blockersApi } from '../api/blockers';
import { LocationCascade } from '../components/LocationCascade';
import { formatStatus, listingLocationLine, listingTitle } from '../utils/listing';
import { LayoutDashboard, PlusCircle, ArrowLeft, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export const DashboardPage = () => {
  const { user, syncRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('listings');
  const [myListings, setMyListings] = useState([]);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState('');
  const [saving, setSaving] = useState(false);

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
    photos: [],
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

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleAddSubmit = async (e) => {
    e.preventDefault();
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

      const files = Array.from(form.photos || []);
      await Promise.all(files.map((file, index) => listingsApi.addPhoto(data.id, file, index)));

      const { data: mine } = await listingsApi.getMine();
      setMyListings(mine || []);
      setSubmittedMsg('Listing submitted for admin approval.');
      setActiveTab('listings');
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
      <aside className="w-full md:w-64 bg-[#0F2C26] text-[#CFE0D9] p-6 flex flex-col justify-between flex-shrink-0">
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
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-left ${
                activeTab === 'listings' ? 'bg-[#007A66] text-white' : 'hover:bg-[#1A3D35]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> My listings
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-left ${
                activeTab === 'add' ? 'bg-[#007A66] text-white' : 'hover:bg-[#1A3D35]'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Add listing
            </button>
          </nav>
        </div>
        <button onClick={() => navigate('/')} className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#8FAF9F] hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to public site
        </button>
      </aside>

      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
        {submittedMsg && <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm">{submittedMsg}</div>}

        {activeTab === 'listings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-brand-ink">My listings</h2>
              <button onClick={() => setActiveTab('add')} className="py-2.5 px-4 bg-brand-green text-white font-semibold rounded-xl text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add New Property
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-brand-line rounded-xl p-5">
                <b className="text-2xl font-bold block">{myListings.length}</b>
                <span className="text-xs text-brand-ink-soft">Your listings</span>
              </div>
              <div className="bg-white border border-brand-line rounded-xl p-5">
                <b className="text-2xl font-bold block">{myListings.filter((l) => l.status === 'APPROVED').length}</b>
                <span className="text-xs text-brand-ink-soft">Live on the site</span>
              </div>
            </div>

            <div className="bg-white border border-brand-line rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-bg-soft border-b border-brand-line text-xs font-semibold text-brand-ink-soft">
                  <tr>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Price (RWF)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line">
                  {myListings.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 font-semibold">{listingTitle(item)}</td>
                      <td className="py-3 px-4 text-brand-ink-soft">{listingLocationLine(item)}</td>
                      <td className="py-3 px-4 font-bold text-brand-green-dark">{Number(item.priceRwf || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          item.status === 'APPROVED' ? 'bg-[#E4F1EC] text-brand-green-dark'
                            : item.status === 'PENDING' ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                          {item.status === 'PENDING' && <Clock className="w-3 h-3" />}
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
            <form onSubmit={handleAddSubmit} className="bg-white border border-brand-line rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Title (EN)</label>
                  <input value={form.titleEn} onChange={update('titleEn')} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Title (RW)</label>
                  <input value={form.titleRw} onChange={update('titleRw')} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Title (FR)</label>
                  <input value={form.titleFr} onChange={update('titleFr')} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
                </div>
              </div>
              <p className="text-xs text-brand-ink-soft">At least one title language is required.</p>

              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Description (EN)</label>
                <textarea value={form.descriptionEn} onChange={update('descriptionEn')} rows={3} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Description (RW)</label>
                  <textarea value={form.descriptionRw} onChange={update('descriptionRw')} rows={3} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Description (FR)</label>
                  <textarea value={form.descriptionFr} onChange={update('descriptionFr')} rows={3} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Type</label>
                  <select value={form.type} onChange={update('type')} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm bg-white">
                    <option value="land">Land</option>
                    <option value="house">House</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Price (RWF)</label>
                  <input type="number" required value={form.priceRwf} onChange={update('priceRwf')} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Size</label>
                  <input type="number" required value={form.sizeValue} onChange={update('sizeValue')} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Size unit</label>
                  <input value={form.sizeUnit} onChange={update('sizeUnit')} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-2">Village (required)</label>
                <LocationCascade required deepest="village" onChange={({ locationId }) => setForm((prev) => ({ ...prev, villageId: locationId }))} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">UPI Number</label>
                <input value={form.upiNumber} onChange={update('upiNumber')} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Photos</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => setForm((prev) => ({ ...prev, photos: e.target.files }))}
                  className="w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-brand-line pt-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Owner name (hidden)</label>
                  <input value={form.ownerName} onChange={update('ownerName')} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Owner phone (hidden)</label>
                  <input value={form.ownerPhone} onChange={update('ownerPhone')} className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm" />
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full py-3 bg-brand-green text-white font-semibold rounded-xl disabled:opacity-60">
                {saving ? 'Submitting…' : 'Submit for admin approval'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
