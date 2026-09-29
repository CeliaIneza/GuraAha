import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shield, Users, FileCheck, DollarSign, Settings, ArrowLeft, Check, X, Sliders } from 'lucide-react';

export const AdminPage = () => {
  const {
    blockerQueue,
    listingQueue,
    approveBlocker,
    rejectBlocker,
    approveListing,
    rejectListing,
    settings,
    updateSettings
  } = useApp();
  const navigate = useNavigate();

  const [bUnlockFee, setBUnlockFee] = useState(settings.blockerUnlockFee);
  const [oUnlockFee, setOUnlockFee] = useState(settings.ownerUnlockFee);
  const [blkProWeek, setBlkProWeek] = useState(settings.blockerProWeekly);
  const [blkProMonth, setBlkProMonth] = useState(settings.blockerProMonthly);

  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleApproveBlocker = (id) => {
    const res = approveBlocker(id);
    showToast(`✅ ${res.name} approved! Unique Blocker Code: ${res.code} (SMS sent)`);
  };

  const handleRejectBlocker = (id) => {
    rejectBlocker(id);
    showToast('❌ Blocker application rejected.');
  };

  const handleApproveListing = (id) => {
    approveListing(id);
    showToast('✅ Property listing approved — now published live on public site!');
  };

  const handleRejectListing = (id) => {
    const reason = prompt('Rejection reason (sent to blocker):', 'Photos unclear — please re-upload clear images');
    if (reason) {
      rejectListing(id, reason);
      showToast(`❌ Listing rejected. Blocker notified: "${reason}"`);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings({
      blockerUnlockFee: parseInt(bUnlockFee, 10) || 100,
      ownerUnlockFee: parseInt(oUnlockFee, 10) || 200,
      blockerProWeekly: parseInt(blkProWeek, 10) || 1500,
      blockerProMonthly: parseInt(blkProMonth, 10) || 5000
    });
    showToast('⚙️ Settings saved successfully! New rates are live across the site.');
  };

  return (
    <div className="min-h-screen bg-[#fafcfa] flex flex-col md:flex-row">
      {/* ADMIN SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#0F2C26] text-[#CFE0D9] p-6 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="pb-5 border-b border-[#1E4038] mb-6">
            <b className="text-white block text-base font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-green" />
              GuraAha Admin
            </b>
            <span className="text-xs text-[#8FAF9F]">Filament Panel Illustration</span>
          </div>

          <nav className="space-y-1 text-sm font-medium">
            <a href="#overview" className="block px-4 py-2.5 rounded-xl bg-[#007A66] text-white font-semibold shadow-sm">
              🏠 Overview
            </a>
            <a href="#blocker-queue" className="block px-4 py-2.5 rounded-xl hover:bg-[#1A3D35] text-[#CFE0D9] transition-colors">
              👤 Blocker approvals ({blockerQueue.length})
            </a>
            <a href="#listing-queue" className="block px-4 py-2.5 rounded-xl hover:bg-[#1A3D35] text-[#CFE0D9] transition-colors">
              📋 Listing approvals ({listingQueue.length})
            </a>
            <a href="#settings" className="block px-4 py-2.5 rounded-xl hover:bg-[#1A3D35] text-[#CFE0D9] transition-colors">
              ⚙️ Live settings
            </a>
          </nav>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#8FAF9F] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to public site
        </button>
      </aside>

      {/* ADMIN MAIN CONTENT */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto space-y-8">
        {toastMsg && (
          <div className="fixed top-4 right-4 z-50 bg-brand-ink text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
            {toastMsg}
          </div>
        )}

        {/* OVERVIEW SECTION */}
        <section id="overview">
          <h2 className="text-2xl font-bold text-brand-ink mb-4">Overview — this month</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-brand-line rounded-xl p-5 shadow-sm">
              <b className="text-3xl font-extrabold text-brand-ink block mb-0.5">1,248</b>
              <span className="text-xs text-brand-ink-soft">Approved listings</span>
            </div>
            <div className="bg-white border border-brand-line rounded-xl p-5 shadow-sm">
              <b className="text-3xl font-extrabold text-brand-ink block mb-0.5">9,430</b>
              <span className="text-xs text-brand-ink-soft">Paid contact unlocks</span>
            </div>
            <div className="bg-white border border-brand-line rounded-xl p-5 shadow-sm">
              <b className="text-3xl font-extrabold text-brand-green-dark block mb-0.5">1.42M</b>
              <span className="text-xs text-brand-ink-soft">Revenue (RWF)</span>
            </div>
            <div className="bg-white border border-brand-line rounded-xl p-5 shadow-sm">
              <b className="text-3xl font-extrabold text-amber-700 block mb-0.5">
                {blockerQueue.length + listingQueue.length}
              </b>
              <span className="text-xs text-brand-ink-soft">Pending approvals</span>
            </div>
          </div>
        </section>

        {/* BLOCKER APPROVAL QUEUE */}
        <section id="blocker-queue" className="bg-white border border-brand-line rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brand-ink mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-green" />
            Blocker Approval Queue ({blockerQueue.length})
          </h3>

          {blockerQueue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-bg-soft border-b border-brand-line text-xs font-semibold text-brand-ink-soft">
                  <tr>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">National ID</th>
                    <th className="py-3 px-4">Primary Area</th>
                    <th className="py-3 px-4">Agreement</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line text-brand-ink">
                  {blockerQueue.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold">{b.name}</td>
                      <td className="py-3 px-4 text-brand-ink-soft font-mono text-xs">{b.nid}</td>
                      <td className="py-3 px-4">{b.area}</td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold text-xs">
                        {b.agreement ? '✅ Accepted' : '❌ Pending'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleApproveBlocker(b.id)}
                          className="px-3 py-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectBlocker(b.id)}
                          className="px-3 py-1.5 border border-brand-line hover:border-red-500 text-brand-ink hover:text-red-600 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 bg-white"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-brand-ink-soft py-4">No pending blocker applications.</p>
          )}
        </section>

        {/* LISTING APPROVAL QUEUE */}
        <section id="listing-queue" className="bg-white border border-brand-line rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brand-ink mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-brand-green" />
            Listing Approval Queue ({listingQueue.length})
          </h3>

          {listingQueue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-bg-soft border-b border-brand-line text-xs font-semibold text-brand-ink-soft">
                  <tr>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Blocker Info</th>
                    <th className="py-3 px-4">Ownership Doc</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line text-brand-ink">
                  {listingQueue.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold">{l.property}</td>
                      <td className="py-3 px-4 text-brand-ink-soft text-xs">{l.blocker}</td>
                      <td className="py-3 px-4 font-mono text-xs text-brand-green hover:underline cursor-pointer">
                        📄 {l.doc}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleApproveListing(l.id)}
                          className="px-3 py-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectListing(l.id)}
                          className="px-3 py-1.5 border border-brand-line hover:border-red-500 text-brand-ink hover:text-red-600 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 bg-white"
                        >
                          <X className="w-3.5 h-3.5" /> Reject…
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-brand-ink-soft py-4">No pending property listings.</p>
          )}
        </section>

        {/* SETTINGS (LIVE-EDITABLE, NO CODE) */}
        <section id="settings" className="bg-white border border-brand-line rounded-xl p-6 shadow-sm max-w-xl">
          <h3 className="text-lg font-bold text-brand-ink mb-1 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-green" />
            Settings (live-editable, no code)
          </h3>
          <p className="text-xs text-brand-ink-soft mb-6">
            Changes take effect immediately across all public forms and payment modals.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                  Blocker unlock fee (RWF)
                </label>
                <input
                  type="number"
                  value={bUnlockFee}
                  onChange={(e) => setBUnlockFee(e.target.value)}
                  className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-semibold text-brand-ink focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                  Owner unlock fee (RWF)
                </label>
                <input
                  type="number"
                  value={oUnlockFee}
                  onChange={(e) => setOUnlockFee(e.target.value)}
                  className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-semibold text-brand-ink focus:outline-none focus:border-brand-green"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                  Blocker Pro / week (RWF)
                </label>
                <input
                  type="number"
                  value={blkProWeek}
                  onChange={(e) => setBlkProWeek(e.target.value)}
                  className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-semibold text-brand-ink focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                  Blocker Pro / month (RWF)
                </label>
                <input
                  type="number"
                  value={blkProMonth}
                  onChange={(e) => setBlkProMonth(e.target.value)}
                  className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-semibold text-brand-ink focus:outline-none focus:border-brand-green"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl text-sm transition-colors shadow-sm mt-2"
            >
              Save settings
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};
