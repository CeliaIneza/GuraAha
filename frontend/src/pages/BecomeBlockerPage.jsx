import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blockersApi } from '../api/blockers';
import { LocationCascade } from '../components/LocationCascade';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const BecomeBlockerPage = () => {
  const { user, syncRole } = useAuth();
  const navigate = useNavigate();
  const [nid, setNid] = useState('');
  const [locationId, setLocationId] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existing, setExisting] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email && !contactEmail) {
      setContactEmail(user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    blockersApi
      .me()
      .then(({ data }) => setExisting(data))
      .catch(() => {});
  }, []);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Please log in to apply as a Blocker</h2>
        <button onClick={() => navigate('/login')} className="py-2.5 px-6 bg-brand-green text-white rounded-xl font-semibold">
          Log in
        </button>
      </div>
    );
  }

  if (user?.role === 'BLOCKER') {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">You are already an approved blocker</h2>
        <button onClick={() => navigate('/dashboard')} className="py-2.5 px-6 bg-brand-green text-white rounded-xl font-semibold">
          Go to dashboard
        </button>
      </div>
    );
  }

  if (user?.role === 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Admin accounts do not apply as blockers</h2>
        <button onClick={() => navigate('/admin')} className="py-2.5 px-6 bg-brand-green text-white rounded-xl font-semibold">
          Open admin
        </button>
      </div>
    );
  }

  const status = existing?.status;
  const alreadyApplied = Boolean(existing);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please accept the Blocker Agreement first.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await blockersApi.apply({
        nationalId: nid,
        operatingLocationId: locationId || undefined,
        contactEmail: contactEmail || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 min-h-screen">
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-brand-green">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">Become a Blocker</h2>
            <p className="text-sm text-brand-ink-soft">
              Apply to join Rwanda's verified network of property blockers
            </p>
          </div>
        </div>

        {submitted || (alreadyApplied && status !== 'NEEDS_REVISION') ? (
          <div className="text-center py-10">
            {status === 'REJECTED' ? (
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            ) : (
              <CheckCircle2 className="w-16 h-16 text-brand-green mx-auto mb-4" />
            )}
            <h3 className="text-2xl font-bold text-brand-ink mb-2">
              {status === 'APPROVED' ? 'You are approved' : status === 'REJECTED' ? 'Application rejected' : 'Application submitted'}
            </h3>
            <p className="text-sm text-brand-ink-soft max-w-md mx-auto leading-relaxed mb-6">
              {status === 'REJECTED'
                ? existing?.rejection_reason || existing?.rejectionReason || 'An admin rejected this application.'
                : 'An admin will review your application. After approval, log out and log back in (or refresh the session) so your blocker dashboard unlocks.'}
            </p>
            <div className="flex gap-3 justify-center">
              {status === 'APPROVED' && (
                <button
                  onClick={async () => {
                    await syncRole();
                    navigate('/dashboard');
                  }}
                  className="py-2.5 px-6 bg-brand-green text-white rounded-xl font-semibold"
                >
                  Open dashboard
                </button>
              )}
              <button onClick={() => navigate('/')} className="py-2.5 px-6 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50">
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

            {status === 'NEEDS_REVISION' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                <p className="font-semibold mb-1">Action required on your previous application:</p>
                <p>{existing?.admin_note || existing?.adminNote || 'Admin requested an update to your application. Check your email or contact support.'}</p>
              </div>
            )}

            {/* Read-only user info */}
            <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Applying as</p>
              <p className="font-bold text-brand-ink">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-brand-ink-soft">{user.phone}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Contact email (optional - for admin to reach you)</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">National ID (Indangamuntu) <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={nid}
                onChange={(e) => setNid(e.target.value)}
                placeholder="1 XXXX X XXXXXXX X XX"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Province & district of operation <span className="text-red-500">*</span></label>
              <LocationCascade deepest="district" onChange={({ locationId: id }) => setLocationId(id)} />
            </div>

            <div className="bg-brand-bg-soft p-4 rounded-xl border-2 border-gray-100 flex items-start gap-3">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 accent-brand-green"
              />
              <label htmlFor="agree" className="text-xs text-brand-ink-soft leading-relaxed cursor-pointer">
                I accept the GuraAha Blocker Agreement: I will only post properties I am authorised to represent, with truthful details and real photos. I understand GuraAha will contact me to verify my identity before approving.
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !agreed}
              className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
