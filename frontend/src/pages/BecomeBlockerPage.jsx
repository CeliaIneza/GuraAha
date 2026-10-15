import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Upload, CheckCircle2 } from 'lucide-react';

export const BecomeBlockerPage = () => {
  const { applyBlocker } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [area, setArea] = useState('Remera, Gasabo');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreed) {
      alert('Please accept the Blocker Agreement first.');
      return;
    }
    applyBlocker({
      name: name || 'Applicant Agent',
      phone: phone || '+250781234567',
      nid: nid || '1 1995 8 001244 1 09',
      area
    });
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 min-h-screen">
      <div className="bg-white border border-brand-line rounded-card p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-brand-green">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">Become a Blocker</h2>
            <p className="text-sm text-brand-ink-soft">
              Earn commissions by listing land &amp; houses in your area. Every blocker is verified before going live.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-10">
            <CheckCircle2 className="w-16 h-16 text-brand-green mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-brand-ink mb-2">Application Submitted!</h3>
            <p className="text-sm text-brand-ink-soft max-w-md mx-auto leading-relaxed mb-6">
              Your application is now in the Admin Review Queue. Once approved, you will receive a unique Blocker Code (e.g. <strong>K7X2PM</strong>) via SMS.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/admin')}
                className="py-2.5 px-6 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green-dark transition-colors text-sm"
              >
                Go to Admin Demo (Review Queue)
              </button>
              <button
                onClick={() => navigate('/')}
                className="py-2.5 px-6 border border-brand-line text-brand-ink font-semibold rounded-xl hover:bg-brand-bg-soft transition-colors text-sm"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Full name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Habimana Jean"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Phone (MoMo)</label>
                <input
                  type="text"
                  required
                  placeholder="+2507 8xx xxx xx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">National ID</label>
                <input
                  type="text"
                  required
                  placeholder="1 19xx x xxxxxxx x xx"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Primary area (Sector)</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green bg-white"
                >
                  <option value="Remera, Gasabo">Remera, Gasabo</option>
                  <option value="Kimironko, Gasabo">Kimironko, Gasabo</option>
                  <option value="Muhoza, Musanze">Muhoza, Musanze</option>
                  <option value="Gisenyi, Rubavu">Gisenyi, Rubavu</option>
                  <option value="Huye town, Huye">Huye town, Huye</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                Upload signed agreement (optional at this step)
              </label>
              <div className="border-2 border-dashed border-brand-line rounded-xl p-4 text-center cursor-pointer hover:border-brand-green transition-colors">
                <Upload className="w-5 h-5 text-brand-ink-soft mx-auto mb-1" />
                <span className="text-xs text-brand-ink-soft">Click to upload agreement document</span>
                <input type="file" className="hidden" />
              </div>
            </div>

            <div className="bg-brand-bg-soft p-4 rounded-xl border border-brand-line flex items-start gap-3">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-brand-green rounded border-gray-300 focus:ring-brand-green"
              />
              <label htmlFor="agree" className="text-xs text-brand-ink-soft leading-relaxed cursor-pointer">
                I accept the GuraAha Blocker Agreement: I will only post properties I am authorised to represent, with truthful details and real photos, and I accept the commission &amp; conduct terms.
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl transition-colors text-base shadow-md"
            >
              Submit for verification
            </button>

            <div className="p-3 bg-brand-bg-soft rounded-lg text-xs text-brand-ink-soft text-center border border-brand-line">
              Flow: submission → admin review → approval → unique blocker code sent by SMS → subscribe → start posting.
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
