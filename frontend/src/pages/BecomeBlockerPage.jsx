import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blockersApi } from '../api/blockers';
import { LocationCascade } from '../components/LocationCascade';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const BecomeBlockerPage = () => {
  const { user, syncRole } = useAuth();
  const navigate = useNavigate();
  const [nid, setNid] = useState('');
  const [locationId, setLocationId] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existing, setExisting] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    blockersApi
      .me()
      .then(({ data }) => setExisting(data))
      .catch(() => {});
  }, []);

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
      <div className="bg-white border border-brand-line rounded-card p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-brand-green">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">Become a Blocker</h2>
            <p className="text-sm text-brand-ink-soft">
              Applying as {user.firstName} {user.lastName} · {user.phone}
            </p>
          </div>
        </div>

        {submitted || alreadyApplied ? (
          <div className="text-center py-10">
            <CheckCircle2 className="w-16 h-16 text-brand-green mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-brand-ink mb-2">
              {status === 'APPROVED' ? 'You are approved' : status === 'REJECTED' ? 'Application rejected' : 'Application submitted'}
            </h3>
            <p className="text-sm text-brand-ink-soft max-w-md mx-auto leading-relaxed mb-6">
              {status === 'REJECTED'
                ? existing.rejection_reason || existing.rejectionReason || 'An admin rejected this application.'
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
              <button onClick={() => navigate('/')} className="py-2.5 px-6 border border-brand-line rounded-xl font-semibold">
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">National ID</label>
              <input
                type="text"
                required
                value={nid}
                onChange={(e) => setNid(e.target.value)}
                className="w-full p-3 border-1.5 border-brand-line rounded-xl text-sm focus:outline-none focus:border-brand-green"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-2">Primary operating area</label>
              <LocationCascade deepest="sector" onChange={({ locationId: id }) => setLocationId(id)} />
            </div>

            <div className="bg-brand-bg-soft p-4 rounded-xl border border-brand-line flex items-start gap-3">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <label htmlFor="agree" className="text-xs text-brand-ink-soft leading-relaxed cursor-pointer">
                I accept the GuraAha Blocker Agreement: I will only post properties I am authorised to represent, with truthful details and real photos.
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit for verification'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
