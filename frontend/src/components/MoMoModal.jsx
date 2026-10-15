import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Smartphone, CheckCircle, X } from 'lucide-react';

export const MoMoModal = () => {
  const { momoModal, closeMoMo, unlockContact } = useApp();
  const [step, setStep] = useState('input'); // 'input' | 'waiting' | 'confirmed'
  const [phone, setPhone] = useState('+250781234567');

  if (!momoModal.isOpen) return null;

  const handleSendPayment = () => {
    setStep('waiting');
    setTimeout(() => {
      setStep('confirmed');
    }, 2200);
  };

  const handleFinish = () => {
    if (momoModal.kind === 'blocker' || momoModal.kind === 'owner') {
      unlockContact(momoModal.listingId, momoModal.kind);
    }
    setStep('input');
    closeMoMo();
  };

  const isPlan = momoModal.kind?.startsWith('plan-');
  const planName = isPlan ? momoModal.kind.replace('plan-', '') : null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={() => { setStep('input'); closeMoMo(); }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'input' && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-brand-green">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-ink">
                  {isPlan ? `${planName} Subscription` : `Unlock ${momoModal.kind === 'blocker' ? 'Blocker (Agent)' : 'Owner'} Contact`}
                </h3>
                <p className="text-sm font-semibold text-brand-green-dark">
                  {momoModal.amount.toLocaleString()} RWF {isPlan ? `/ ${momoModal.period}` : ''}
                </p>
              </div>
            </div>

            <p className="text-sm text-brand-ink-soft my-4 leading-relaxed">
              Enter your MTN MoMo or Airtel Money number. You'll receive a payment prompt directly on your mobile device.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                Mobile Money Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2507 8xx xxx xx"
                className="w-full px-4 py-3 border-1.5 border-brand-line rounded-xl text-base font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              />
            </div>

            <button
              onClick={handleSendPayment}
              className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl transition-colors shadow-md text-base"
            >
              Send Payment Request
            </button>
            <p className="text-xs text-center text-brand-ink-soft mt-3">
              Secured by MTN MoMo &amp; Airtel Money Instant Pay
            </p>
          </div>
        )}

        {step === 'waiting' && (
          <div className="text-center py-6">
            <div className="w-12 h-12 border-4 border-brand-line border-t-brand-green rounded-full animate-spin-custom mx-auto mb-4" />
            <h3 className="text-xl font-bold text-brand-ink mb-2">Check your phone 📲</h3>
            <p className="text-sm text-brand-ink-soft leading-relaxed max-w-xs mx-auto">
              We sent a <strong className="text-brand-ink">{momoModal.amount.toLocaleString()} RWF</strong> request to {phone}. Please approve it with your MoMo PIN.
            </p>
            <div className="mt-4 p-3 bg-brand-bg-soft rounded-lg text-xs text-brand-ink-soft">
              Simulated payment processing...
            </div>
          </div>
        )}

        {step === 'confirmed' && (
          <div className="text-center py-4">
            <CheckCircle className="w-16 h-16 text-brand-green mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-brand-ink mb-1">Payment Confirmed</h3>
            <p className="text-sm text-brand-ink-soft mb-4">
              {isPlan ? (
                <>🎉 <strong>{planName}</strong> membership activated for {momoModal.period === 'week' ? '7 days' : '30 days'}!</>
              ) : (
                <>Contact details unlocked permanently for this listing.<br />🎟️ <strong>+1 entry</strong> in this month's GuraAha Lotto!</>
              )}
            </p>
            <button
              onClick={handleFinish}
              className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl transition-colors shadow-md text-base"
            >
              {isPlan ? 'Start Using Plan' : 'View Contact Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
