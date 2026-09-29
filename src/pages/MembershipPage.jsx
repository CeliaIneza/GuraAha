import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, ShieldCheck, Key } from 'lucide-react';

export const MembershipPage = () => {
  const { settings, openMoMo } = useApp();
  const [period, setPeriod] = useState('month'); // 'week' | 'month'

  const blockerPrice = period === 'week' ? settings.blockerProWeekly : settings.blockerProMonthly;
  const unlockPassPrice = period === 'week' ? settings.unlockPassWeekly : settings.unlockPassMonthly;

  const handleSubscribe = (planName, amount) => {
    openMoMo({
      kind: `plan-${planName}`,
      amount,
      title: `${planName} Subscription`,
      period
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12 min-h-screen">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl font-bold text-brand-ink mb-3">Membership plans</h2>
        <p className="text-brand-ink-soft text-base leading-relaxed">
          Pay by the week or by the month — whatever fits your cash flow. All payments by MTN MoMo or Airtel Money.
        </p>

        {/* TOGGLE BUTTONS */}
        <div className="inline-flex bg-white border-1.5 border-brand-line rounded-full p-1 mt-6 shadow-sm">
          <button
            onClick={() => setPeriod('week')}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
              period === 'week' ? 'bg-brand-green text-white shadow-sm' : 'text-brand-ink-soft hover:text-brand-ink'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
              period === 'month' ? 'bg-brand-green text-white shadow-sm' : 'text-brand-ink-soft hover:text-brand-ink'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* PLANS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* BLOCKER PRO */}
        <div className="bg-white border-2 border-brand-green rounded-card p-8 shadow-xl relative flex flex-col justify-between">
          <div className="absolute -top-3 left-6 bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            For blockers
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-brand-green" />
              <h3 className="text-xl font-bold text-brand-ink">Blocker Pro</h3>
            </div>
            <div className="text-xs text-brand-ink-soft mb-6">Required to post listings</div>

            <div className="text-4xl font-extrabold text-brand-green-dark mb-6">
              {blockerPrice.toLocaleString()} <span className="text-sm font-medium text-brand-ink-soft">RWF / {period}</span>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2.5 text-sm text-brand-ink-soft">
                <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Post unlimited property listings</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-brand-ink-soft">
                <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Verified badge + unique SMS code</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-brand-ink-soft">
                <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Earn commissions on every contact unlock</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-brand-ink-soft">
                <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Dashboard with analytics, views &amp; leads</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSubscribe('Blocker Pro', blockerPrice)}
            className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl transition-colors text-base shadow-md"
          >
            Subscribe &amp; start posting
          </button>
        </div>

        {/* UNLOCK PASS */}
        <div className="bg-white border-1.5 border-brand-line rounded-card p-8 shadow-md relative flex flex-col justify-between">
          <div className="absolute -top-3 left-6 bg-[#D3B42B] text-brand-ink text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Pilot idea
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-6 h-6 text-brand-earth" />
              <h3 className="text-xl font-bold text-brand-ink">Unlock Pass</h3>
            </div>
            <div className="text-xs text-brand-ink-soft mb-6">For serious house-hunters</div>

            <div className="text-4xl font-extrabold text-brand-green-dark mb-6">
              {unlockPassPrice.toLocaleString()} <span className="text-sm font-medium text-brand-ink-soft">RWF / {period}</span>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2.5 text-sm text-brand-ink-soft">
                <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Unlimited contact unlocks for all properties</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-brand-ink-soft">
                <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Instead of paying 100–200 RWF each time</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-brand-ink-soft">
                <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Lotto entry on every unlock kept</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-brand-ink-soft">
                <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Special priority agent hotline access</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSubscribe('Unlock Pass', unlockPassPrice)}
            className="w-full py-3.5 bg-white border-1.5 border-brand-line hover:border-brand-green hover:text-brand-green text-brand-ink font-semibold rounded-xl transition-all text-base"
          >
            Get the pass
          </button>
        </div>
      </div>

      <div className="mt-10 p-4 bg-brand-bg-soft rounded-xl border border-brand-line text-xs text-brand-ink-soft max-w-4xl mx-auto text-center">
        All plan prices live in the admin settings table — weekly and monthly rates are editable without code, so the business can test pricing freely.
      </div>
    </div>
  );
};
