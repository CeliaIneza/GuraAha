import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, PlusCircle, CreditCard, BarChart3, ArrowLeft, CheckCircle, Clock, AlertTriangle, Building2 } from 'lucide-react';

export const DashboardPage = () => {
  const { listings, addListing } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'add'

  // Add Listing Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState('plot');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [prov, setProv] = useState('Kigali City');
  const [dist, setDist] = useState('Gasabo');
  const [sect, setSect] = useState('Remera');
  const [cell, setCell] = useState('Rukiri I');
  const [vill, setVill] = useState('Amajyambere');
  const [upi, setUpi] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState(false);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addListing({
      title: title || 'Residential plot in Kigali',
      type,
      price: parseInt(price, 10) || 18500000,
      size: size || '600 m²',
      upi: upi || '1/02/09/04/999',
      prov,
      dist,
      sect,
      cell,
      vill,
      blocker: 'Habimana J. · K7X2PM',
      desc: 'Beautiful property located in a high-growth residential corridor with full infrastructure access.'
    });
    setSubmittedMsg(true);
    setTimeout(() => {
      setSubmittedMsg(false);
      setActiveTab('listings');
    }, 2500);
  };

  const myListings = listings.filter(l => l.blocker.includes('Habimana'));

  return (
    <div className="min-h-screen bg-[#fafcfa] flex flex-col md:flex-row">
      {/* DASHBOARD SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#0F2C26] text-[#CFE0D9] p-6 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="pb-5 border-b border-[#1E4038] mb-6">
            <b className="text-white block text-base font-bold">Habimana Jean</b>
            <span className="text-xs text-[#8FAF9F] flex items-center gap-1 mt-0.5">
              Blocker · Code: <strong className="text-white">K7X2PM</strong> ✅
            </span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('listings')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                activeTab === 'listings' ? 'bg-[#007A66] text-white font-semibold shadow-sm' : 'hover:bg-[#1A3D35] text-[#CFE0D9]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              My listings
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                activeTab === 'add' ? 'bg-[#007A66] text-white font-semibold shadow-sm' : 'hover:bg-[#1A3D35] text-[#CFE0D9]'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Add listing
            </button>
            <button
              onClick={() => navigate('/membership')}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium hover:bg-[#1A3D35] text-[#CFE0D9] text-left transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Subscription
            </button>
            <button
              onClick={() => alert('Leads feature: 23 contacts unlocked this month.')}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium hover:bg-[#1A3D35] text-[#CFE0D9] text-left transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              My unlocks &amp; leads
            </button>
          </nav>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#8FAF9F] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to public site
        </button>
      </aside>

      {/* DASHBOARD MAIN MAIN CONTENT */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {activeTab === 'listings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-brand-ink">My listings dashboard</h2>
              <button
                onClick={() => setActiveTab('add')}
                className="py-2.5 px-4 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Add New Property
              </button>
            </div>

            {/* KPIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border border-brand-line rounded-xl p-5 shadow-sm">
                <b className="text-2xl font-bold text-brand-ink block mb-0.5">{myListings.length}</b>
                <span className="text-xs text-brand-ink-soft">Active listings</span>
              </div>
              <div className="bg-white border border-brand-line rounded-xl p-5 shadow-sm">
                <b className="text-2xl font-bold text-brand-ink block mb-0.5">134</b>
                <span className="text-xs text-brand-ink-soft">Views this month</span>
              </div>
              <div className="bg-white border border-brand-line rounded-xl p-5 shadow-sm">
                <b className="text-2xl font-bold text-brand-ink block mb-0.5">23</b>
                <span className="text-xs text-brand-ink-soft">Contact unlocks earned</span>
              </div>
              <div className="bg-white border-2 border-brand-green rounded-xl p-5 shadow-sm">
                <b className="text-2xl font-bold text-brand-green-dark block mb-0.5">Active</b>
                <span className="text-xs text-brand-ink-soft">
                  Blocker Pro · Monthly — renews in 22 days
                </span>
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-brand-line rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brand-bg-soft border-b border-brand-line text-xs font-semibold text-brand-ink-soft">
                    <tr>
                      <th className="py-3 px-4">Property</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Price (RWF)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Unlocks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-line text-brand-ink">
                    {myListings.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-semibold">{item.title}</td>
                        <td className="py-3 px-4 text-brand-ink-soft">{item.sect}, {item.dist}</td>
                        <td className="py-3 px-4 font-bold text-brand-green-dark">{item.price.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            item.status === 'approved'
                              ? 'bg-[#E4F1EC] text-brand-green-dark'
                              : item.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                            {item.status === 'pending' && <Clock className="w-3 h-3" />}
                            {item.status === 'rejected' && <AlertTriangle className="w-3 h-3" />}
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold">9</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-brand-ink mb-6">Add listing (all fields)</h2>

            {submittedMsg && (
              <div className="mb-6 p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Listing saved as PENDING and submitted to the Admin approval queue!
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="bg-white border border-brand-line rounded-xl p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Title (RW / EN / FR)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ubutaka bwiza i Remera…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-green bg-white"
                  >
                    <option value="plot">Plot</option>
                    <option value="land">Land</option>
                    <option value="house">House — finished</option>
                    <option value="house-under">House — under construction</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Price (RWF)</label>
                  <input
                    type="number"
                    required
                    placeholder="18500000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Size (m²)</label>
                  <input
                    type="text"
                    required
                    placeholder="600 m²"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Village &amp; Location</label>
                  <input
                    type="text"
                    placeholder="Rukiri I, Remera, Gasabo"
                    value={`${vill}, ${sect}, ${dist}`}
                    onChange={(e) => setVill(e.target.value)}
                    className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">UPI Number</label>
                  <input
                    type="text"
                    required
                    placeholder="1/02/09/04/432"
                    value={upi}
                    onChange={(e) => setUpi(e.target.value)}
                    className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Photos (min 3)</label>
                  <input type="file" multiple className="w-full text-xs text-brand-ink-soft file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-bg-soft file:text-brand-ink hover:file:bg-brand-line" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Ownership proof (admins only)</label>
                  <input type="file" className="w-full text-xs text-brand-ink-soft file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-bg-soft file:text-brand-ink hover:file:bg-brand-line" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-brand-line pt-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Owner name (hidden)</label>
                  <input
                    type="text"
                    placeholder="e.g. Mukamana Alice"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Owner phone (hidden · 200 RWF unlock)</label>
                  <input
                    type="text"
                    placeholder="+250 722 xxx xxx"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl transition-colors text-sm shadow-md mt-4"
              >
                Submit for admin approval
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
