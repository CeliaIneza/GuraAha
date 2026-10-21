import React, { createContext, useContext, useEffect, useState } from 'react';
import { i18n } from '../data/mockData';
import { settingsApi } from '../api/settings';

const AppContext = createContext();

const DEFAULT_SETTINGS = {
  blockerUnlockFee: 100,
  ownerUnlockFee: 200,
  blockerProWeekly: 1500,
  blockerProMonthly: 5000,
  unlockPassWeekly: 1000,
  unlockPassMonthly: 3500,
};

const SETTINGS_MAP = {
  blocker_unlock_fee: 'blockerUnlockFee',
  owner_unlock_fee: 'ownerUnlockFee',
  blocker_pro_weekly: 'blockerProWeekly',
  blocker_pro_monthly: 'blockerProMonthly',
  unlock_pass_weekly: 'unlockPassWeekly',
  unlock_pass_monthly: 'unlockPassMonthly',
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

  useEffect(() => {
    let isMounted = true;
    settingsApi.getAll()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        if (isMounted && list.length > 0) {
          setSettings((prev) => {
            const next = { ...prev };
            list.forEach((item) => {
              const key = SETTINGS_MAP[item.key] || item.key;
              const num = Number(item.value);
              next[key] = isNaN(num) ? item.value : num;
            });
            return next;
          });
        }
      })
      .catch(() => {})
      .finally(() => { if (isMounted) setSettingsLoaded(true); });
    return () => { isMounted = false; };
  }, []);

  const notifyUnlock = () => setUnlockTimestamp(Date.now());
  const notifySubscription = () => setSubscriptionTimestamp(Date.now());
  const t = (key) => (i18n[lang] && i18n[lang][key]) || i18n.en[key] || key;
  const openMoMo = (config) => setMomoModal({ isOpen: true, kind: config.kind, listingId: config.listingId || null, amount: config.amount, title: config.title || '', period: config.period || 'month' });
  const closeMoMo = () => setMomoModal((prev) => ({ ...prev, isOpen: false }));

  return (
    <AppContext.Provider value={{
      lang, setLang, t,
      settings, settingsLoaded,
      momoModal, openMoMo, closeMoMo,
      unlockTimestamp, notifyUnlock,
      subscriptionTimestamp, notifySubscription,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
