import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { paymentsApi } from '../api/payments';
import { subscriptionsApi } from '../api/subscriptions';
import { Smartphone, X, Check, Copy, Loader2, Phone } from 'lucide-react';

export const MoMoModal = () => {
  const { momoModal, closeMoMo, notifyUnlock, notifySubscription } = useApp();
  const { user } = useAuth();
  const [stage, setStage] = useState('idle');
  const [momoPhone, setMomoPhone] = useState('');
  const [paymentId, setPaymentId] = useState(null);
  const [contact, setContact] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const isSubscription = momoModal.kind?.startsWith('subscription-');
  const subscriptionPlan = isSubscription ? momoModal.kind.replace('subscription-', '') : null;
  const unlockType = momoModal.kind === 'blocker' ? 'BLOCKER' : 'OWNER';

  useEffect(() => {
    if (momoModal.isOpen) {
      setStage('idle');
      setMomoPhone(user?.phone || '');
      setPaymentId(null);
      setContact(null);
      setError('');
      setInstructions('');
      setCopied(false);
    }
  }, [momoModal.isOpen, user?.phone]);

  if (!momoModal.isOpen) return null;

  const handleInitiate = async () => {
    if (!momoPhone.trim()) { setError('Please enter your MoMo phone number'); return; }
    setError('');
    setLoading(true);
    try {
      if (isSubscription) {
        const { data } = await subscriptionsApi.initiate({ plan: subscriptionPlan, momoPhone: momoPhone.trim() });
        if (data.alreadyActive) {
          setContact({ name: 'Already Active', phone: `Expires: ${new Date(data.subscription.expires_at).toLocaleDateString()}` });
          setStage('revealed');
        } else {
          setPaymentId(data.paymentId);
          setInstructions(data.instructions || 'Complete your MoMo payment, then click the button below.');
          setStage('pending');
        }
      } else {
        if (!momoModal.listingId) { setError('Listing ID missing'); setLoading(false); return; }
        const { data } = await paymentsApi.initiateUnlock({
          listingId: momoModal.listingId,
          type: unlockType,
          momoPhone: momoPhone.trim(),
          amountRwf: momoModal.amount,
        });
        if (data.alreadyUnlocked) {
          setContact(data.contact);
          setStage('revealed');
        } else {
          setPaymentId(data.paymentId);
          setInstructions(data.instructions || 'Complete your MoMo payment, then click the button below.');
          setStage('pending');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      if (isSubscription) {
        const { data } = await subscriptionsApi.confirm(paymentId);
        const exp = data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : '';
        setContact({ name: `${subscriptionPlan === 'weekly' ? 'Weekly' : 'Monthly'} plan activated!`, phone: exp ? `Valid until ${exp}` : 'Active' });
        notifySubscription();
        setStage('revealed');
      } else {
        const { data } = await paymentsApi.confirmUnlock(paymentId);
        setContact(data.contact);
        notifyUnlock();
        setStage('revealed');
      }
    } catch (err) {
      setError(err.message || 'Payment not verified yet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(contact?.phone || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => { closeMoMo(); setStage('idle'); };

  const headerTitle = isSubscription
    ? (stage === 'revealed' ? 'Subscription Activated!' : `Subscribe ${subscriptionPlan === 'weekly' ? 'Weekly' : 'Monthly'}`)
    : (stage === 'idle' ? `Unlock ${unlockType === 'BLOCKER' ? 'Agent' : 'Owner'} Contact` : stage === 'pending' ? 'Complete Payment' : 'Contact Revealed!');

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className={`px-6 pt-6 pb-4 ${stage === 'revealed' ? 'bg-gradient-to-br from-[#00594A] to-[#007A66] text-white' : ''}`}>
          <button onClick={handleClose} className={`absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 transition-colors ${stage === 'revealed' ? 'text-white/80' : 'text-gray-400 hover:text-gray-600'}`}>
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${stage === 'revealed' ? 'bg-white/20' : 'bg-emerald-100'}`}>
              {stage === 'revealed' ? <Check className="w-6 h-6 text-white" /> : <Smartphone className="w-6 h-6 text-brand-green" />}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${stage === 'revealed' ? 'text-white' : 'text-brand-ink'}`}>{headerTitle}</h3>
              <p className={`text-sm font-semibold ${stage === 'revealed' ? 'text-emerald-200' : 'text-brand-green-dark'}`}>
                {Number(momoModal.amount || 0).toLocaleString()} RWF
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {error && <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          {stage === 'idle' && (
            <div className="mt-4 space-y-4">
              {!isSubscription && (
                <div className="bg-brand-bg-soft rounded-xl p-4 border border-brand-line">
                  <p className="text-xs font-semibold text-brand-ink-soft mb-1">Property</p>
                  <p className="text-sm font-bold text-brand-ink line-clamp-2">{momoModal.title}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />MoMo phone number
                </label>
                <input type="tel" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)} placeholder="0788xxxxxx"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green" />
                <p className="text-xs text-brand-ink-soft mt-1">We'll send a MoMo push to this number</p>
              </div>
              <button onClick={handleInitiate} disabled={loading}
                className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                {loading ? 'Sending...' : `Pay ${Number(momoModal.amount).toLocaleString()} RWF via MoMo`}
              </button>
              <p className="text-xs text-center text-brand-ink-soft">Secured payment · Contact revealed instantly after payment</p>
            </div>
          )}

          {stage === 'pending' && (
            <div className="mt-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">Action required</p>
                <p className="text-sm text-amber-700 leading-relaxed">{instructions}</p>
              </div>
              <div className="text-center py-2">
                <p className="text-xs text-brand-ink-soft">Paying from: <span className="font-bold text-brand-ink">{momoPhone}</span></p>
              </div>
              <button onClick={handleConfirm} disabled={loading}
                className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {loading ? 'Verifying...' : "I've Paid - Reveal Contact"}
              </button>
              <button onClick={() => setStage('idle')} className="w-full text-xs text-brand-ink-soft hover:text-brand-ink underline">← Change phone number</button>
            </div>
          )}

          {stage === 'revealed' && contact && (
            <div className="mt-4 space-y-4">
              <div className="bg-[#E4F1EC] border border-[#007A66]/30 rounded-xl p-5 text-center">
                <p className="text-xs font-semibold text-brand-green-dark mb-2 uppercase tracking-wide">
                  {isSubscription ? 'Subscription Status' : (unlockType === 'BLOCKER' ? 'Agent Contact' : 'Owner Contact')}
                </p>
                {contact.name && <p className="font-bold text-brand-ink text-lg mb-1">{contact.name}</p>}
                <p className="text-xl font-bold text-brand-green-dark tracking-wider">{contact.phone}</p>
              </div>
              {!isSubscription && (
                <button onClick={handleCopy}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${copied ? 'bg-brand-green text-white' : 'bg-brand-bg-soft hover:bg-brand-line text-brand-ink border border-brand-line'}`}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy number'}
                </button>
              )}
              <button onClick={handleClose} className="w-full py-3 border border-brand-line rounded-xl text-sm font-semibold text-brand-ink hover:bg-brand-bg-soft">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
