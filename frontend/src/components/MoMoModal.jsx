import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { paymentsApi } from '../api/payments';
import { subscriptionsApi } from '../api/subscriptions';
import { Smartphone, X, Check, Copy, Loader2, Phone, RefreshCw } from 'lucide-react';

export const MoMoModal = () => {
  const { momoModal, closeMoMo, notifyUnlock, notifySubscription } = useApp();
  const { user } = useAuth();
  const [stage, setStage] = useState('idle'); // idle | pending | revealed | error
  const [momoPhone, setMomoPhone] = useState('');
  const [contact, setContact] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const isSubscription = momoModal.kind?.startsWith('subscription-');
  const subscriptionPlan = isSubscription
    ? momoModal.kind.replace('subscription-', '').toUpperCase()
    : null;
  const unlockType = momoModal.kind === 'blocker' ? 'BLOCKER' : 'OWNER';

  useEffect(() => {
    if (momoModal.isOpen) {
      setStage('idle');
      setMomoPhone(user?.phone || '');
      setContact(null);
      setError('');
      setInstructions('');
      setCopied(false);
    }
  }, [momoModal.isOpen, user?.phone]);

  if (!momoModal.isOpen) return null;

  // â”€â”€ Initiate payment (send MoMo push) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleInitiate = async () => {
    if (!momoPhone.trim()) {
      setError('Please enter your MoMo phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isSubscription) {
        // POST /subscriptions/initiate  body: { phone, plan }
        const res = await subscriptionsApi.initiate({
          phone: momoPhone.trim(),
          plan: subscriptionPlan, // 'WEEKLY' | 'MONTHLY'
        });
        setInstructions(
          res?.message ||
            'Approve the USSD prompt on your phone, then tap "Check Status" below.'
        );
        setStage('pending');
      } else {
        if (!momoModal.listingId) {
          setError('Listing ID missing');
          setLoading(false);
          return;
        }
        // POST /listings/:listingId/contact/unlock  body: { type, phone }
        const res = await paymentsApi.initiateUnlock(momoModal.listingId, {
          type: unlockType,
          phone: momoPhone.trim(),
        });
        setInstructions(
          res?.message ||
            'Approve the USSD prompt on your phone, then tap "Check Status" below.'
        );
        setStage('pending');
      }
    } catch (err) {
      // If already unlocked, go straight to revealed state by checking status
      if (err?.message?.toLowerCase().includes('already unlocked') || err?.message?.toLowerCase().includes('already')) {
        await handleCheckStatus();
      } else {
        setError(err.message || 'Failed to initiate payment');
      }
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€ Check status (poll after user approved MoMo push) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCheckStatus = async () => {
    setError('');
    setChecking(true);
    try {
      if (isSubscription) {
        // GET /subscriptions/status
        const res = await subscriptionsApi.getStatus();
        const sub = res?.data;
        if (sub && (sub.status === 'ACTIVE' || sub.is_active)) {
          const exp = sub.expires_at || sub.expiresAt;
          setContact({
            name: `${subscriptionPlan === 'MONTHLY' ? 'Monthly' : subscriptionPlan === 'QUARTERLY' ? 'Quarterly' : 'Yearly'} plan activated!`,
            phone: exp ? `Valid until ${new Date(exp).toLocaleDateString()}` : 'Active',
          });
          notifySubscription();
          setStage('revealed');
        } else {
          setError(
            'Payment not confirmed yet. Make sure you approved the MoMo prompt, then try again.'
          );
        }
      } else {
        // GET /listings/:listingId/contact
        const res = await paymentsApi.getRevealedContact(momoModal.listingId);
        const data = res?.data;

        const phone =
          unlockType === 'BLOCKER' ? data?.blockerPhone : data?.ownerPhone;
        const name = unlockType === 'OWNER' ? data?.ownerName : undefined;

        if (phone) {
          setContact({ phone, name: name || null });
          notifyUnlock();
          setStage('revealed');
        } else {
          setError(
            'Contact not yet revealed. Make sure you approved the MoMo push on your phone, then try again.'
          );
        }
      }
    } catch (err) {
      setError(err.message || 'Could not check payment status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(contact?.phone || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    closeMoMo();
    setStage('idle');
  };

  const headerTitle = isSubscription
    ? stage === 'revealed'
      ? 'Subscription Activated!'
      : `Subscribe ${subscriptionPlan === 'MONTHLY' ? 'Monthly' : subscriptionPlan === 'QUARTERLY' ? 'Quarterly' : 'Yearly'}`
    : stage === 'idle'
      ? `Unlock ${unlockType === 'BLOCKER' ? 'Agent' : 'Owner'} Contact`
      : stage === 'pending'
        ? 'Complete Payment'
        : 'Contact Revealed!';

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 pt-6 pb-4 ${
            stage === 'revealed'
              ? 'bg-gradient-to-br from-[#00594A] to-[#007A66] text-white'
              : ''
          }`}
        >
          <button
            onClick={handleClose}
            className={`absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 transition-colors ${
              stage === 'revealed' ? 'text-white/80' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center ${
                stage === 'revealed' ? 'bg-white/20' : 'bg-emerald-100'
              }`}
            >
              {stage === 'revealed' ? (
                <Check className="w-6 h-6 text-white" />
              ) : (
                <Smartphone className="w-6 h-6 text-brand-green" />
              )}
            </div>
            <div>
              <h3
                className={`text-lg font-bold ${
                  stage === 'revealed' ? 'text-white' : 'text-brand-ink'
                }`}
              >
                {headerTitle}
              </h3>
              <p
                className={`text-sm font-semibold ${
                  stage === 'revealed' ? 'text-emerald-200' : 'text-brand-green-dark'
                }`}
              >
                {Number(momoModal.amount || 0).toLocaleString()} RWF
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* â”€â”€ STAGE: idle â”€â”€ */}
          {stage === 'idle' && (
            <div className="mt-4 space-y-4">
              {!isSubscription && (
                <div className="bg-brand-bg-soft rounded-xl p-4 border border-brand-line">
                  <p className="text-xs font-semibold text-brand-ink-soft mb-1">Property</p>
                  <p className="text-sm font-bold text-brand-ink line-clamp-2">
                    {momoModal.title}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />
                  MoMo phone number
                </label>
                <input
                  type="tel"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  placeholder="0788xxxxxx"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green"
                />
                <p className="text-xs text-brand-ink-soft mt-1">
                  We&apos;ll send a MoMo push to this number
                </p>
              </div>
              <button
                onClick={handleInitiate}
                disabled={loading}
                className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Smartphone className="w-4 h-4" />
                )}
                {loading ? 'Sending...' : `Pay ${Number(momoModal.amount).toLocaleString()} RWF via MoMo`}
              </button>
              <p className="text-xs text-center text-brand-ink-soft">
                Secured payment Â· Powered by MTN Mobile Money
              </p>
            </div>
          )}

          {/* â”€â”€ STAGE: pending (waiting for MoMo push approval) â”€â”€ */}
          {stage === 'pending' && (
            <div className="mt-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  ðŸ“± Action required on your phone
                </p>
                <p className="text-sm text-amber-700 leading-relaxed">{instructions}</p>
              </div>
              <div className="text-center py-2">
                <p className="text-xs text-brand-ink-soft">
                  Paying from:{' '}
                  <span className="font-bold text-brand-ink">{momoPhone}</span>
                </p>
              </div>
              <button
                onClick={handleCheckStatus}
                disabled={checking}
                className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                {checking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {checking ? 'Checking...' : "I've Approved â€” Check Status"}
              </button>
              <button
                onClick={() => setStage('idle')}
                className="w-full text-xs text-brand-ink-soft hover:text-brand-ink underline"
              >
                â† Change phone number
              </button>
            </div>
          )}

          {/* â”€â”€ STAGE: revealed â”€â”€ */}
          {stage === 'revealed' && contact && (
            <div className="mt-4 space-y-4">
              <div className="bg-[#E4F1EC] border border-[#007A66]/30 rounded-xl p-5 text-center">
                <p className="text-xs font-semibold text-brand-green-dark mb-2 uppercase tracking-wide">
                  {isSubscription
                    ? 'Subscription Status'
                    : unlockType === 'BLOCKER'
                      ? 'ðŸ  Agent Contact'
                      : 'ðŸ‘¤ Owner Contact'}
                </p>
                {contact.name && (
                  <p className="font-bold text-brand-ink text-lg mb-1">{contact.name}</p>
                )}
                <p className="text-xl font-bold text-brand-green-dark tracking-wider">
                  {contact.phone}
                </p>
              </div>
              {!isSubscription && (
                <button
                  onClick={handleCopy}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    copied
                      ? 'bg-brand-green text-white'
                      : 'bg-brand-bg-soft hover:bg-brand-line text-brand-ink border border-brand-line'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy number'}
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-full py-3 border border-brand-line rounded-xl text-sm font-semibold text-brand-ink hover:bg-brand-bg-soft"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

