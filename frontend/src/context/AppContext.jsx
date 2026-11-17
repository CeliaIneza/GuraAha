import React, { createContext, useContext, useEffect, useState } from 'react';
import { i18n } from '../data/mockData';
import { settingsApi } from '../api/settings';

const AppContext = createContext();

const DEFAULT_SETTINGS = {
  blockerUnlockFee: 500,
  ownerUnlockFee: 1000,
  blockerProWeekly: 1500,
  blockerProMonthly: 5000,
  unlockPassWeekly: 1000,
  unlockPassMonthly: 3500,
  vipRoomWeekly: 2500,
  vipRoomMonthly: 8000,
};

const SETTINGS_MAP = {
  blocker_unlock_fee: 'blockerUnlockFee',
  owner_unlock_fee: 'ownerUnlockFee',
  blocker_pro_weekly: 'blockerProWeekly',
  blocker_pro_monthly: 'blockerProMonthly',
  unlock_pass_weekly: 'unlockPassWeekly',
  unlock_pass_monthly: 'unlockPassMonthly',
  vip_room_weekly: 'vipRoomWeekly',
  vip_room_monthly: 'vipRoomMonthly',
};

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('guraaha_lang') || 'en');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [unlockTimestamp, setUnlockTimestamp] = useState(0);
  const [subscriptionTimestamp, setSubscriptionTimestamp] = useState(0);

  const [momoModal, setMomoModal] = useState({
    isOpen: false, kind: null, listingId: null, amount: 0, title: '', period: 'month',
  });

  useEffect(() => { localStorage.setItem('guraaha_lang', lang); }, [lang]);

  const refreshSettings = React.useCallback(() => {
    return settingsApi.getPublic()
      .then((res) => {
        if (!res?.data) return;
        const data = res.data;

        setSettings((prev) => {
          const next = { ...prev };

          if (Array.isArray(data)) {
            data.forEach((item) => {
              const key = SETTINGS_MAP[item.key] || item.key;
              const num = Number(item.value);
              next[key] = isNaN(num) ? item.value : num;
            });
          } else if (typeof data === 'object') {
            const unlockPrices = data.contact_unlock_prices_rwf;
            if (unlockPrices && typeof unlockPrices === 'object') {
              if (typeof unlockPrices.BLOCKER === 'number') next.blockerUnlockFee = unlockPrices.BLOCKER;
              if (typeof unlockPrices.OWNER === 'number') next.ownerUnlockFee = unlockPrices.OWNER;
            }
            const plans = data.subscription_plans;
            if (plans && typeof plans === 'object') {
              if (plans.BLOCKER_PRO_WEEKLY?.priceRwf) next.blockerProWeekly = Number(plans.BLOCKER_PRO_WEEKLY.priceRwf);
              if (plans.BLOCKER_PRO_MONTHLY?.priceRwf) next.blockerProMonthly = Number(plans.BLOCKER_PRO_MONTHLY.priceRwf);
              if (plans.UNLOCK_PASS_WEEKLY?.priceRwf) next.unlockPassWeekly = Number(plans.UNLOCK_PASS_WEEKLY.priceRwf);
              if (plans.UNLOCK_PASS_MONTHLY?.priceRwf) next.unlockPassMonthly = Number(plans.UNLOCK_PASS_MONTHLY.priceRwf);
              if (plans.VIP_ROOM_WEEKLY?.priceRwf) next.vipRoomWeekly = Number(plans.VIP_ROOM_WEEKLY.priceRwf);
              if (plans.VIP_ROOM_MONTHLY?.priceRwf) next.vipRoomMonthly = Number(plans.VIP_ROOM_MONTHLY.priceRwf);
            }
            Object.entries(SETTINGS_MAP).forEach(([rawKey, mappedKey]) => {
              if (data[rawKey] !== undefined) {
                const num = Number(data[rawKey]);
                next[mappedKey] = isNaN(num) ? data[rawKey] : num;
              }
            });
          }
          return next;
        });
      })
      .catch(() => {})
      .finally(() => { setSettingsLoaded(true); });
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const notifyUnlock = () => setUnlockTimestamp(Date.now());
  const notifySubscription = () => setSubscriptionTimestamp(Date.now());
  const t = (key) => (i18n[lang] && i18n[lang][key]) || i18n.en[key] || key;
  const openMoMo = (config) => setMomoModal({ isOpen: true, kind: config.kind, listingId: config.listingId || null, amount: config.amount, title: config.title || '', period: config.period || 'month' });
  const closeMoMo = () => setMomoModal((prev) => ({ ...prev, isOpen: false }));

  return (
    <AppContext.Provider value={{
      lang, setLang, t,
      settings, settingsLoaded, refreshSettings,
      momoModal, openMoMo, closeMoMo,
      unlockTimestamp, notifyUnlock,
      subscriptionTimestamp, notifySubscription,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
