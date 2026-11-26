import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Check, ShieldCheck, Key, Star, AlertCircle } from 'lucide-react';

export const MembershipPage = () => {
  const { settings, openMoMo, t } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month'); // 'week' | 'month'
  const [restrictionError, setRestrictionError] = useState('');

  const blockerPrice = period === 'week' ? settings.blockerProWeekly : settings.blockerProMonthly;
  const unlockPassPrice = period === 'week' ? settings.unlockPassWeekly : settings.unlockPassMonthly;
  const vipRoomPrice = period === 'week' ? settings.vipRoomWeekly : settings.vipRoomMonthly;

  const isVerifiedBlocker = user?.role === 'BLOCKER';

  const handleSubscribe = (planKey, amount) => {
    setRestrictionError('');
    const suffix = period === 'week' ? 'weekly' : 'monthly';

    if (planKey === 'blocker') {
      if (!user) {
        setRestrictionError(
          'Only verified Blockers can pay for a Blocker Pro subscription. Please log in with an approved Blocker account first, or apply at "Become a Blocker".'
        );
        return;
      }
      if (!isVerifiedBlocker) {
        setRestrictionError(
          'Only verified Blockers can subscribe to Blocker Pro. Because your account is not a Blocker account, payment for Blocker Pro is disabled. You can subscribe to the Unlock Pass or VIP Room below, or apply at "Become a Blocker".'
        );
        return;
      }
      openMoMo({
        kind: `subscription-${suffix}`,
        amount,
        title: `${t('mem_bp_title')} (${period === 'week' ? t('mem_weekly') : t('mem_monthly')})`,
        listingId: null,
        period,
      });
    } else if (planKey === 'unlock') {
      if (!user) {
        navigate('/login', { state: { from: '/membership' } });
        return;
      }
      openMoMo({
        kind: `subscription-unlock_pass_${suffix}`,
        amount,
        title: `${t('mem_up_title')} (${period === 'week' ? t('mem_weekly') : t('mem_monthly')})`,
        listingId: null,
        period,
      });
    } else if (planKey === 'vip') {
      if (!user) {
        navigate('/login', { state: { from: '/membership' } });
        return;
      }
      openMoMo({
        kind: `subscription-vip_room_${suffix}`,
        amount,
        title: `${t('mem_vip_title')} (${period === 'week' ? t('mem_weekly') : t('mem_monthly')})`,
        listingId: null,
        period,
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 min-h-screen">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl font-bold text-brand-ink mb-3">{t('mem_title')}</h2>
        <p className="text-brand-ink-soft text-sm sm:text-base leading-relaxed">
          {t('mem_sub')}
        </p>

        {/* TOGGLE BUTTONS */}
        <div className="inline-flex bg-white border-2 border-gray-200 rounded-full p-1 mt-6 shadow-xs">
          <button
            onClick={() => setPeriod('week')}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all cursor-pointer ${
              period === 'week'
                ? 'bg-brand-green text-white shadow-xs'
                : 'text-brand-ink-soft hover:text-brand-ink'
            }`}
          >
            {t('mem_weekly')}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all cursor-pointer ${
              period === 'month'
                ? 'bg-brand-green text-white shadow-xs'
                : 'text-brand-ink-soft hover:text-brand-ink'
            }`}
          >
            {t('mem_monthly')}
          </button>
        </div>
      </div>

      {restrictionError && (
        <div className="max-w-3xl mx-auto mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{restrictionError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!user && (
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-lg bg-brand-green text-white text-xs font-bold hover:bg-brand-green-dark transition-colors"
              >
                Log in
              </Link>
            )}
            <Link
              to="/become-blocker"
              className="px-3.5 py-2 rounded-lg bg-white border border-red-300 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors"
            >
              Become a Blocker →
            </Link>
          </div>
        </div>
      )}

      {/* 3 PLANS GRID matching prototype */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. BLOCKER PRO */}
        <div className="bg-white border-2 border-brand-green rounded-2xl p-7 shadow-lg relative flex flex-col justify-between">
          <div className="absolute -top-3 left-6 bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {t('mem_for_blockers')}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-brand-green" />
              <h3 className="text-xl font-bold text-brand-ink">{t('mem_bp_title')}</h3>
            </div>
            <div className="text-xs text-brand-ink-soft mb-5">{t('mem_bp_sub')}</div>

            <div className="text-3xl sm:text-4xl font-extrabold text-brand-green-dark mb-6">
              {Number(blockerPrice || 0).toLocaleString()}{' '}
              <span className="text-xs sm:text-sm font-medium text-brand-ink-soft">
                RWF / {period === 'week' ? t('mem_weekly') : t('mem_monthly')}
              </span>
            </div>

            <ul className="space-y-3 mb-6">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="flex items-center gap-2.5 text-sm text-brand-ink-soft">
                  <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                  <span>{t(`mem_bp_f${n}`)}</span>
                </li>
              ))}
            </ul>

            {!isVerifiedBlocker && (
              <div className="mb-4 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11.5px] text-amber-900 font-medium">
                🔒 Restricted to approved Blockers.{' '}
                <Link to="/become-blocker" className="underline font-bold text-brand-green">
                  Apply as a Blocker
                </Link>{' '}
                to unlock this plan.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSubscribe('blocker', blockerPrice)}
            className={`w-full py-3 font-semibold rounded-xl transition-colors text-sm sm:text-base shadow-sm cursor-pointer ${
              isVerifiedBlocker
                ? 'bg-brand-green hover:bg-brand-green-dark text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
            }`}
          >
            {isVerifiedBlocker ? t('mem_bp_btn') : '🔒 Verified Blockers Only'}
          </button>
        </div>

        {/* 2. UNLOCK PASS */}
        <div className="bg-white border-2 border-brand-line rounded-2xl p-7 shadow-sm relative flex flex-col justify-between">
          <div className="absolute -top-3 left-6 bg-[#D3B42B] text-brand-ink text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {t('mem_for_buyers')}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-6 h-6 text-brand-earth" />
              <h3 className="text-xl font-bold text-brand-ink">{t('mem_up_title')}</h3>
            </div>
            <div className="text-xs text-brand-ink-soft mb-5">{t('mem_up_sub')}</div>

            <div className="text-3xl sm:text-4xl font-extrabold text-brand-green-dark mb-6">
              {Number(unlockPassPrice || 0).toLocaleString()}{' '}
              <span className="text-xs sm:text-sm font-medium text-brand-ink-soft">
                RWF / {period === 'week' ? t('mem_weekly') : t('mem_monthly')}
              </span>
            </div>

            <ul className="space-y-3 mb-8">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="flex items-center gap-2.5 text-sm text-brand-ink-soft">
                  <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                  <span>{t(`mem_up_f${n}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => handleSubscribe('unlock', unlockPassPrice)}
            className="w-full py-3 bg-white border-2 border-brand-green hover:bg-brand-green hover:text-white text-brand-green font-semibold rounded-xl transition-all text-sm sm:text-base cursor-pointer"
          >
            {t('mem_up_btn')}
          </button>
        </div>

        {/* 3. VIP ROOM PASS */}
        <div className="bg-gradient-to-br from-[#FFFDF2] to-[#F7EFC7] border-2 border-[#D3B42B] rounded-2xl p-7 shadow-md relative flex flex-col justify-between">
          <div className="absolute -top-3 left-6 bg-[#D3B42B] text-[#1C2A24] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            ⭐ {t('mem_vip_badge')}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-6 h-6 text-[#9E8419] fill-[#D3B42B]" />
              <h3 className="text-xl font-bold text-brand-ink">{t('mem_vip_title')}</h3>
            </div>
            <div className="text-xs text-brand-ink-soft mb-5">{t('mem_vip_sub')}</div>

            <div className="text-3xl sm:text-4xl font-extrabold text-[#7A6412] mb-6">
              {Number(vipRoomPrice || 0).toLocaleString()}{' '}
              <span className="text-xs sm:text-sm font-medium text-brand-ink-soft">
                RWF / {period === 'week' ? t('mem_weekly') : t('mem_monthly')}
              </span>
            </div>

            <ul className="space-y-3 mb-8">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="flex items-center gap-2.5 text-sm text-brand-ink">
                  <Check className="w-4 h-4 text-[#7A6412] flex-shrink-0" />
                  <span>{t(`mem_vip_f${n}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => handleSubscribe('vip', vipRoomPrice)}
            className="w-full py-3 bg-[#D3B42B] hover:bg-[#c5a622] text-[#1C2A24] font-bold rounded-xl transition-all text-sm sm:text-base shadow-sm cursor-pointer"
          >
            ⭐ {t('mem_vip_btn')}
          </button>
        </div>
      </div>
    </div>
  );
};
