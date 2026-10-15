import React, { createContext, useContext, useEffect, useState } from 'react';
import { i18n } from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('guraaha_lang') || 'en');

  const [settings] = useState({
    blockerUnlockFee: 100,
    ownerUnlockFee: 200,
    blockerProWeekly: 1500,
    blockerProMonthly: 5000,
    unlockPassWeekly: 1000,
    unlockPassMonthly: 3500,
  });

  const [momoModal, setMomoModal] = useState({
    isOpen: false,
    kind: null,
    listingId: null,
    amount: 0,
    title: '',
    period: 'month',
  });

  useEffect(() => {
    localStorage.setItem('guraaha_lang', lang);
  }, [lang]);

  const t = (key) => (i18n[lang] && i18n[lang][key]) || i18n.en[key] || key;

  const openMoMo = (config) => {
    setMomoModal({
      isOpen: true,
      kind: config.kind,
      listingId: config.listingId || null,
      amount: config.amount,
      title: config.title || '',
      period: config.period || 'month',
    });
  };

  const closeMoMo = () => {
    setMomoModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        settings,
        momoModal,
        openMoMo,
        closeMoMo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
