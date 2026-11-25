import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { i18n, DEFAULT_CATEGORIES, DEFAULT_AREA_HIGHLIGHTS } from '../data/translations';
import { settingsApi } from '../api/settings';
import { categoriesApi } from '../api/categories';
import { locationsApi } from '../api/locations';
import { safeStorage } from '../api/client';

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
  vipDays: 7,
  vipMinDiscount: 20,
  lottoPrize: 250000,
  homeFeaturedMin: 3,
  homeLatestCount: 6,
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
  vip_promotion_days: 'vipDays',
  vip_min_discount_percent: 'vipMinDiscount',
  lotto_prize_rwf: 'lottoPrize',
  home_featured_min: 'homeFeaturedMin',
  home_latest_count: 'homeLatestCount',
};

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => safeStorage.getItem('guraaha_lang') || 'en');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [liveStats, setLiveStats] = useState({
    listingsCount: null,
    verifiedBlockersCount: null,
    districtsCount: 30,
    contactsUnlockedCount: null,
  });
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [areaHighlights, setAreaHighlights] = useState(DEFAULT_AREA_HIGHLIGHTS);
  const [unlockTimestamp, setUnlockTimestamp] = useState(0);
  const [subscriptionTimestamp, setSubscriptionTimestamp] = useState(0);

  const [momoModal, setMomoModal] = useState({
    isOpen: false, kind: null, listingId: null, amount: 0, title: '', period: 'month',
  });

  useEffect(() => {
    safeStorage.setItem('guraaha_lang', lang);
  }, [lang]);

  const refreshSettings = useCallback(() => {
    return settingsApi.getPublic()
      .then((res) => {
        if (!res?.data) return;
        const data = res.data;

        if (data.live_stats && typeof data.live_stats === 'object') {
          setLiveStats({
            listingsCount: Number(data.live_stats.listingsCount ?? 0),
            verifiedBlockersCount: Number(data.live_stats.verifiedBlockersCount ?? 0),
            districtsCount: Number(data.live_stats.districtsCount || 30),
            contactsUnlockedCount: Number(data.live_stats.contactsUnlockedCount ?? 0),
          });
        }

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

  const refreshCategories = useCallback(() => {
    return categoriesApi.getAll()
      .then((res) => {
        const list = res?.data;
        if (Array.isArray(list) && list.length > 0) {
          setCategories(list);
        }
      })
      .catch(() => {});
  }, []);

  const refreshAreaHighlights = useCallback(() => {
    return locationsApi.getAreaHighlights()
      .then((res) => {
        const payload = res?.data;
        if (Array.isArray(payload) && payload.length > 0) {
          setAreaHighlights(payload);
        } else if (Array.isArray(payload?.districts) && payload.districts.length > 0) {
          setAreaHighlights(payload.districts);
        } else if (Array.isArray(payload?.highlights) && payload.highlights.length > 0) {
          setAreaHighlights(payload.highlights);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshCategories();
    refreshAreaHighlights();
  }, [refreshSettings, refreshCategories, refreshAreaHighlights]);

  const notifyUnlock = () => setUnlockTimestamp(Date.now());
  const notifySubscription = () => setSubscriptionTimestamp(Date.now());
  const t = (key) => (i18n[lang] && i18n[lang][key]) || i18n.en[key] || key;

  // Translate dynamic category or sub-type by slug or English name
  const tCat = useCallback((slugOrName) => {
    if (!slugOrName) return '';
    const norm = String(slugOrName).trim().toLowerCase();
    // Legacy mapping for house / land
    if (norm === 'house') {
      const resCat = categories.find((c) => c.slug === 'residential');
      if (resCat) return lang === 'rw' ? (resCat.name_rw || resCat.name_en) : lang === 'fr' ? (resCat.name_fr || resCat.name_en) : resCat.name_en;
      return t('type_house');
    }
    if (norm === 'land') {
      const landCat = categories.find((c) => c.slug === 'land-and-plots');
      if (landCat) return lang === 'rw' ? (landCat.name_rw || landCat.name_en) : lang === 'fr' ? (landCat.name_fr || landCat.name_en) : landCat.name_en;
      return t('type_land');
    }

    for (const c of categories) {
      if (
        String(c.slug).toLowerCase() === norm ||
        String(c.name_en).toLowerCase() === norm ||
        String(c.id).toLowerCase() === norm
      ) {
        if (lang === 'rw' && c.name_rw) return c.name_rw;
        if (lang === 'fr' && c.name_fr) return c.name_fr;
        return c.name_en;
      }
      const subs = c.subtypes || c.subTypes || [];
      for (const s of subs) {
        if (
          String(s.slug).toLowerCase() === norm ||
          String(s.name_en).toLowerCase() === norm ||
          String(s.id).toLowerCase() === norm
        ) {
          if (lang === 'rw' && s.name_rw) return s.name_rw;
          if (lang === 'fr' && s.name_fr) return s.name_fr;
          return s.name_en;
        }
      }
    }
    return slugOrName;
  }, [categories, lang]);

  const getDistrictHighlight = useCallback((districtName) => {
    if (!districtName) return null;
    const norm = String(districtName).trim().toLowerCase();

    if (Array.isArray(areaHighlights)) {
      const found = areaHighlights.find(
        (a) => String(a?.district_name || '').toLowerCase() === norm
      );
      if (!found) return null;
      const raw =
        lang === 'rw' && found.highlights_rw
          ? found.highlights_rw
          : lang === 'fr' && found.highlights_fr
          ? found.highlights_fr
          : found.highlights_en;
      const items = Array.isArray(raw)
        ? raw
        : typeof raw === 'string'
        ? (() => {
            try {
              const p = JSON.parse(raw);
              return Array.isArray(p) ? p : [raw];
            } catch {
              return [raw];
            }
          })()
        : [];
      return items.filter(Boolean);
    }

    if (areaHighlights && typeof areaHighlights === 'object') {
      const entry =
        Object.entries(areaHighlights).find(([k]) => k.toLowerCase() === norm)?.[1] ||
        areaHighlights.default;
      if (!entry) return null;
      const raw = entry[lang] || entry.en;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') return [raw];
    }

    return null;
  }, [areaHighlights, lang]);

  const openMoMo = (config) => setMomoModal({
    isOpen: true,
    kind: config.kind,
    listingId: config.listingId || null,
    amount: config.amount,
    title: config.title || '',
    period: config.period || 'month',
  });
  const closeMoMo = () => setMomoModal((prev) => ({ ...prev, isOpen: false }));

  return (
    <AppContext.Provider value={{
      lang, setLang, t, tCat,
      liveStats,
      categories, setCategories, refreshCategories,
      areaHighlights, setAreaHighlights, refreshAreaHighlights, getDistrictHighlight,
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
