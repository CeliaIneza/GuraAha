import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blockersApi } from '../api/blockers';
import { listingsApi } from '../api/listings';
import { listingTitle, blockerLabel } from '../utils/listing';
import { Shield, Users, FileCheck, ArrowLeft, Check, X } from 'lucide-react';

export const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blockerQueue, setBlockerQueue] = useState([]);
  const [listingQueue, setListingQueue] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);
  const [error, setError] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const load = async () => {
    setError('');
    try {
      const [blockers, listings] = await Promise.all([blockersApi.pending(), listingsApi.getPending()]);
      setBlockerQueue(blockers.data || []);
      setListingQueue(listings.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApproveBlocker = async (id) => {
    try {
      const { data } = await blockersApi.approve(id);
      showToast(`Approved. Code: ${data.verification_code || data.verificationCode || 'issued'}`);
      load();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleRejectBlocker = async (id) => {
    const reason = prompt('Rejection reason:', 'Incomplete application');
    if (!reason) return;
    try {
      await blockersApi.reject(id, reason);
      showToast('Blocker application rejected.');
      load();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleApproveListing = async (id) => {
    try {
      await listingsApi.approve(id);
      showToast('Listing approved and now public.');
      load();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleRejectListing = async (id) => {
    const reason = prompt('Rejection reason (sent to blocker):', 'Please re-upload clearer photos');
    if (!reason) return;
    try {
      await listingsApi.reject(id, reason);
      showToast('Listing rejected.');
      load();
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafcfa] flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-[#0F2C26] text-[#CFE0D9] p-6 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="pb-5 border-b border-[#1E4038] mb-6">
            <b className="text-white block text-base font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-green" />
              GuraAha Admin
            </b>
            <span className="text-xs text-[#8FAF9F]">{user.firstName} {user.lastName}</span>
          </div>
          <nav className="space-y-1 text-sm font-medium">
            <a href="#blocker-queue" className="block px-4 py-2.5 rounded-xl hover:bg-[#1A3D35]">
              Blocker approvals ({blockerQueue.length})
            </a>
            <a href="#listing-queue" className="block px-4 py-2.5 rounded-xl hover:bg-[#1A3D35]">
              Listing approvals ({listingQueue.length})
            </a>
          </nav>
        </div>
        <button onClick={() => navigate('/')} className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#8FAF9F] hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to public site
        </button>
      </aside>

      <main className="flex-1 p-6 sm:p-10 overflow-y-auto space-y-8">
        {toastMsg && (
          <div className="fixed top-4 right-4 z-50 bg-brand-ink text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold">
            {toastMsg}
          </div>
        )}
        {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

        <section>
          <h2 className="text-2xl font-bold text-brand-ink mb-4">Review queues</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-brand-line rounded-xl p-5">
              <b className="text-3xl font-extrabold block">{blockerQueue.length}</b>
              <span className="text-xs text-brand-ink-soft">Pending blockers</span>
            </div>
            <div className="bg-white border border-brand-line rounded-xl p-5">
              <b className="text-3xl font-extrabold block">{listingQueue.length}</b>
              <span className="text-xs text-brand-ink-soft">Pending listings</span>
            </div>
          </div>
        </section>

        <section id="blocker-queue" className="bg-white border border-brand-line rounded-xl p-6">
          <h3 className="text-lg font-bold text-brand-ink mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-green" />
            Blocker approval queue
          </h3>
          {blockerQueue.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-bg-soft text-xs font-semibold text-brand-ink-soft">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">National ID</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line">
                {blockerQueue.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 px-4 font-semibold">
                      {b.first_name || b.firstName} {b.last_name || b.lastName}
                      <div className="text-xs text-brand-ink-soft">{b.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{b.national_id || b.nationalId}</td>
                    <td className="py-3 px-4">{b.operating_location_name || b.operatingLocationName || '—'}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button onClick={() => handleApproveBlocker(b.id)} className="px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleRejectBlocker(b.id)} className="px-3 py-1.5 border border-brand-line text-xs font-semibold rounded-lg inline-flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-brand-ink-soft py-4">No pending blocker applications.</p>
          )}
        </section>

        <section id="listing-queue" className="bg-white border border-brand-line rounded-xl p-6">
          <h3 className="text-lg font-bold text-brand-ink mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-brand-green" />
            Listing approval queue
          </h3>
          {listingQueue.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-bg-soft text-xs font-semibold text-brand-ink-soft">
                <tr>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Blocker</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line">
                {listingQueue.map((l) => (
                  <tr key={l.id}>
                    <td className="py-3 px-4 font-semibold">{listingTitle(l)}</td>
                    <td className="py-3 px-4 text-xs text-brand-ink-soft">{blockerLabel(l)}</td>
                    <td className="py-3 px-4 text-xs">{l.ownerName || '—'} {l.ownerPhone ? `· ${l.ownerPhone}` : ''}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button onClick={() => handleApproveListing(l.id)} className="px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleRejectListing(l.id)} className="px-3 py-1.5 border border-brand-line text-xs font-semibold rounded-lg inline-flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Reject…
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-brand-ink-soft py-4">No pending property listings.</p>
          )}
        </section>
      </main>
    </div>
  );
};
