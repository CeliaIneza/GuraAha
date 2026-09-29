import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialListings, initialBlockerQueue, initialListingQueue, i18n } from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('guraaha_lang') || 'en');
  
  const [listings, setListings] = useState(() => {
    const saved = localStorage.getItem('guraaha_listings');
    return saved ? JSON.parse(saved) : initialListings;
  });

  const [unlockedContacts, setUnlockedContacts] = useState(() => {
    const saved = localStorage.getItem('guraaha_unlocked');
    return saved ? JSON.parse(saved) : {};
  });

  const [blockerQueue, setBlockerQueue] = useState(() => {
    const saved = localStorage.getItem('guraaha_blocker_queue');
    return saved ? JSON.parse(saved) : initialBlockerQueue;
  });

  const [listingQueue, setListingQueue] = useState(() => {
    const saved = localStorage.getItem('guraaha_listing_queue');
    return saved ? JSON.parse(saved) : initialListingQueue;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('guraaha_settings');
    return saved ? JSON.parse(saved) : {
      blockerUnlockFee: 100,
      ownerUnlockFee: 200,
      blockerProWeekly: 1500,
      blockerProMonthly: 5000,
      unlockPassWeekly: 1000,
      unlockPassMonthly: 3500
    };
  });

  const [momoModal, setMomoModal] = useState({
    isOpen: false,
    kind: null, // 'blocker', 'owner', 'plan-Blocker Pro', 'plan-Unlock Pass'
    listingId: null,
    amount: 0,
    title: '',
    period: 'month'
  });

  useEffect(() => {
    localStorage.setItem('guraaha_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('guraaha_listings', JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    localStorage.setItem('guraaha_unlocked', JSON.stringify(unlockedContacts));
  }, [unlockedContacts]);

  useEffect(() => {
    localStorage.setItem('guraaha_blocker_queue', JSON.stringify(blockerQueue));
  }, [blockerQueue]);

  useEffect(() => {
    localStorage.setItem('guraaha_listing_queue', JSON.stringify(listingQueue));
  }, [listingQueue]);

  useEffect(() => {
    localStorage.setItem('guraaha_settings', JSON.stringify(settings));
  }, [settings]);

  const t = (key) => {
    return (i18n[lang] && i18n[lang][key]) || i18n['en'][key] || key;
  };

  const openMoMo = (config) => {
    setMomoModal({
      isOpen: true,
      kind: config.kind,
      listingId: config.listingId || null,
      amount: config.amount,
      title: config.title || '',
      period: config.period || 'month'
    });
  };

  const closeMoMo = () => {
    setMomoModal((prev) => ({ ...prev, isOpen: false }));
  };

  const unlockContact = (listingId, kind) => {
    setUnlockedContacts((prev) => {
      const current = prev[listingId] || [];
      if (!current.includes(kind)) {
        return { ...prev, [listingId]: [...current, kind] };
      }
      return prev;
    });
  };

  const approveBlocker = (id) => {
    const applicant = blockerQueue.find(b => b.id === id);
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setBlockerQueue((prev) => prev.filter(b => b.id !== id));
    return { name: applicant ? applicant.name : 'Applicant', code };
  };

  const rejectBlocker = (id) => {
    setBlockerQueue((prev) => prev.filter(b => b.id !== id));
  };

  const approveListing = (id) => {
    setListingQueue((prev) => prev.filter(l => l.id !== id));
  };

  const rejectListing = (id, reason) => {
    setListingQueue((prev) => prev.filter(l => l.id !== id));
  };

  const addListing = (newListingData) => {
    const newId = listings.length > 0 ? Math.max(...listings.map(l => l.id)) + 1 : 1;
    const newListing = {
      id: newId,
      ...newListingData,
      status: 'pending',
      vip: false,
      blockerPhone: '+250 788 456 210',
      ownerPhone: '+250 722 903 114',
      cls: 't1',
      ic: '🏡'
    };
    setListingQueue((prev) => [
      ...prev,
      { id: `lq_${newId}`, property: `${newListing.title} — ${newListing.dist}`, blocker: 'Habimana J. (K7X2PM)', doc: 'upi_cert.pdf' }
    ]);
    return newListing;
  };

  const applyBlocker = (data) => {
    const newId = `bq_${Date.now()}`;
    setBlockerQueue((prev) => [
      ...prev,
      { id: newId, name: data.name, nid: data.nid, area: data.area, agreement: true }
    ]);
  };

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const totalUnlockedCount = Object.values(unlockedContacts).reduce((acc, arr) => acc + arr.length, 9430);

  return (
    <AppContext.Provider value={{
      lang,
      setLang,
      t,
      listings,
      unlockedContacts,
      totalUnlockedCount,
      blockerQueue,
      listingQueue,
      settings,
      updateSettings,
      momoModal,
      openMoMo,
      closeMoMo,
      unlockContact,
      approveBlocker,
      rejectBlocker,
      approveListing,
      rejectListing,
      addListing,
      applyBlocker
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
