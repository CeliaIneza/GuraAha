import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ListingCard } from '../components/ListingCard';
import { listingsApi } from '../api/listings';
import { locationsApi } from '../api/locations';
import { newsApi } from '../api/news';
import { initialListings, initialNews } from '../data/mockData';
import {
  isFeaturedListing,
  listingCategory,
} from '../utils/listing';
import { Search } from 'lucide-react';

export const HomePage = () => {
  const { lang, t, tCat, categories, settings, liveStats } = useApp();
  const navigate = useNavigate();

  const [allListings, setAllListings] = useState(initialListings);
  const [newsItems, setNewsItems] = useState(initialNews);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDeal, setSelectedDeal] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');

  useEffect(() => {
    locationsApi
      .provinces()
      .then(({ data }) => setProvinces(data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    listingsApi
      .listApproved({ pageSize: 60 })
      .then(({ data }) => {
        setAllListings(Array.isArray(data) ? data : []);
      })
      .catch(() => setAllListings([]));

    newsApi
      .getAll()
      .then((res) => {
        setNewsItems(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => setNewsItems([]));
  }, []);

  const handleProvinceChange = async (provId) => {
    setSelectedProvince(provId);
    setSelectedDistrict('');
    if (!provId) {
      setDistricts([]);
      return;
    }
    try {
      const { data } = await locationsApi.children(provId);
      setDistricts(data || []);
    } catch {
      setDistricts([]);
    }
  };

  const activeCategoryObj = useMemo(
    () => categories.find((c) => c.slug === selectedCat || c.name_en === selectedCat),
    [categories, selectedCat]
  );

  const subTypesForSelectedCat = useMemo(
    () => activeCategoryObj?.subtypes || activeCategoryObj?.subTypes || [],
    [activeCategoryObj]
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    const locId = selectedDistrict || selectedProvince;
    if (locId) params.set('locationId', locId);
    if (selectedProvince) params.set('province', selectedProvince);
    if (selectedDistrict) params.set('district', selectedDistrict);
    if (selectedDeal) params.set('deal', selectedDeal);
    if (selectedCat) params.set('category', selectedCat);
    if (selectedType) params.set('subType', selectedType);
    if (selectedPrice) params.set('price', selectedPrice);
    navigate(`/browse?${params.toString()}`);
  };

  // Non-VIP approved listings
  const publicListings = useMemo(
    () => allListings.filter((l) => !l.vip && !l.is_vip && !l.isVip),
    [allListings]
  );

  // Featured listings (at least settings.homeFeaturedMin = 3, topped up with newest if fewer)
  const featuredListings = useMemo(() => {
    const minCount = Number(settings.homeFeaturedMin) || 3;
    const explicitFeatured = publicListings.filter((l) => isFeaturedListing(l));
    const result = [...explicitFeatured];
    if (result.length < minCount) {
      for (const item of publicListings) {
        if (!result.some((r) => r.id === item.id)) {
          result.push(item);
        }
        if (result.length >= minCount) break;
      }
    }
    return result;
  }, [publicListings, settings.homeFeaturedMin]);

  // Latest listings (at least settings.homeLatestCount = 6)
  const latestListings = useMemo(() => {
    const count = Math.max(6, Number(settings.homeLatestCount) || 6);
    return publicListings.slice(0, count);
  }, [publicListings, settings.homeLatestCount]);

  // Count listings per category for Category Quick-Filter Pills
  const getCategoryCount = (cat) => {
    const slug = String(cat.slug || '').toLowerCase();
    const nameEn = String(cat.name_en || '').toLowerCase();
    return publicListings.filter((l) => {
      const lCat = String(listingCategory(l) || '').toLowerCase();
      return lCat === slug || lCat === nameEn;
    }).length;
  };

  // Real database counts (falling back to current loaded listings count if backend hasn't responded yet)
  const dbListingsCount =
    liveStats?.listingsCount !== null && liveStats?.listingsCount !== undefined
      ? liveStats.listingsCount
      : allListings.length;
  const dbBlockersCount =
    liveStats?.verifiedBlockersCount !== null && liveStats?.verifiedBlockersCount !== undefined
      ? liveStats.verifiedBlockersCount
      : 0;
  const dbDistrictsCount = liveStats?.districtsCount || 30;
  const dbUnlocksCount =
    liveStats?.contactsUnlockedCount !== null && liveStats?.contactsUnlockedCount !== undefined
      ? liveStats.contactsUnlockedCount
      : 0;

  return (
    <div className="min-h-screen bg-[#F6F5F0]">
      {/* Hero Section with Background Image & Brand Green Overlay */}
      <section
        className="relative text-white py-14 sm:py-16 px-4 sm:px-8 lg:px-10 bg-cover bg-center border-b border-brand-line"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0, 68, 56, 0.86) 0%, rgba(0, 122, 102, 0.78) 55%, rgba(15, 44, 38, 0.85) 100%), url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&auto=format&fit=crop&q=80')`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-tight drop-shadow-sm">
            {t('hero_title')}
          </h1>
          <p className="mt-3.5 text-base sm:text-lg opacity-95 max-w-xl leading-relaxed">
            {t('hero_sub')}
          </p>

          {/* Search Bar */}
          <div className="bg-white text-brand-ink rounded-[14px] p-3.5 sm:p-4 mt-7 shadow-2xl border border-white/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-center">
              <select
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full h-11 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              >
                <option value="">{t('lbl_province')}</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedProvince || districts.length === 0}
                className="w-full h-11 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green disabled:opacity-60 disabled:bg-brand-bg-soft"
              >
                <option value="">{t('lbl_district')}</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedDeal}
                onChange={(e) => setSelectedDeal(e.target.value)}
                className="w-full h-11 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              >
                <option value="">{t('deal_any')}</option>
                <option value="sale">{t('deal_sale')}</option>
                <option value="rent">{t('deal_rent')}</option>
              </select>

              <select
                value={selectedCat}
                onChange={(e) => {
                  setSelectedCat(e.target.value);
                  setSelectedType('');
                }}
                className="w-full h-11 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              >
                <option value="">{t('all_categories')}</option>
                {categories.map((c) => (
                  <option key={c.slug || c.id} value={c.slug || c.name_en}>
                    {tCat(c.slug || c.name_en)}
                  </option>
                ))}
              </select>

              {subTypesForSelectedCat.length > 0 ? (
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full h-11 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
                >
                  <option value="">{t('all_subtypes')}</option>
                  {subTypesForSelectedCat.map((s) => (
                    <option key={s.slug || s.id} value={s.slug || s.name_en}>
                      {tCat(s.slug || s.name_en)}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-full h-11 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
                >
                  <option value="">{t('any_price')}</option>
                  <option value="5000000">&lt; 5M RWF</option>
                  <option value="20000000">5M – 20M RWF</option>
                  <option value="100000000">&gt; 20M RWF</option>
                </select>
              )}

              <button
                type="button"
                onClick={handleSearch}
                className="w-full h-11 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>{t('search')}</span>
              </button>
            </div>
          </div>

          {/* 4 Live Database Metrics: Listings | Verified blockers | 30 Districts | Contacts unlocked */}
          <div className="flex flex-wrap gap-8 sm:gap-14 mt-9 text-white">
            <div>
              <b className="text-2xl sm:text-3xl font-bold block">
                {Number(dbListingsCount).toLocaleString('en-US')}
              </b>
              <span className="text-xs sm:text-sm opacity-90">{t('st1') || 'Listings'}</span>
            </div>
            <div>
              <b className="text-2xl sm:text-3xl font-bold block">
                {Number(dbBlockersCount).toLocaleString('en-US')}
              </b>
              <span className="text-xs sm:text-sm opacity-90">
                {lang === 'rw'
                  ? 'Abakommissiyoneri bemewe'
                  : lang === 'fr'
                  ? 'Agents vérifiés'
                  : 'Verified blockers'}
              </span>
            </div>
            <div>
              <b className="text-2xl sm:text-3xl font-bold block">{dbDistrictsCount}</b>
              <span className="text-xs sm:text-sm opacity-90">
                {t('st_districts') || 'Districts'}
              </span>
            </div>
            <div>
              <b className="text-2xl sm:text-3xl font-bold block">
                {Number(dbUnlocksCount).toLocaleString('en-US')}
              </b>
              <span className="text-xs sm:text-sm opacity-90">
                {lang === 'rw'
                  ? 'Nimero zabonetse'
                  : lang === 'fr'
                  ? 'Contacts débloqués'
                  : 'Contacts unlocked'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-12">
        {/* 1. Featured Listings Section (minimum 3 listings chosen by Admin) */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-widest uppercase text-[#9E8419] mb-1">
                <span>★</span>
                <span>{t('featured_badge')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">
                {t('feat_title')}
              </h2>
            </div>
            <button
              onClick={() => navigate('/browse')}
              className="px-4 py-2 rounded-[9px] border-2 border-brand-green text-brand-green font-semibold text-sm hover:bg-brand-green hover:text-white transition-colors cursor-pointer"
            >
              {t('view_all')} →
            </button>
          </div>
          <p className="text-brand-ink-soft text-sm sm:text-base mb-6">
            {t('feat_sub')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredListings.map((listing) => (
              <ListingCard key={`feat-${listing.id}`} listing={listing} />
            ))}
          </div>
        </section>

        {/* 2. Latest Listings Section + Category Quick-Filter Pills (minimum 6 latest listings) */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">
              {t('latest_title')}
            </h2>
            <button
              onClick={() => navigate('/browse')}
              className="px-4 py-2 rounded-[9px] border-2 border-brand-green text-brand-green font-semibold text-sm hover:bg-brand-green hover:text-white transition-colors cursor-pointer"
            >
              {t('view_all')} →
            </button>
          </div>
          <p className="text-brand-ink-soft text-sm sm:text-base mb-4">
            {t('latest_sub')}
          </p>

          {/* Category Quick-Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => {
              const count = getCategoryCount(cat);
              const slug = cat.slug || cat.name_en;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => navigate(`/browse?category=${encodeURIComponent(slug)}`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-brand-line text-brand-ink hover:border-brand-green hover:text-brand-green text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  <span>{tCat(slug)}</span>
                  <span className="text-brand-ink-soft font-normal">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {latestListings.map((listing) => (
              <ListingCard key={`latest-${listing.id}`} listing={listing} />
            ))}
          </div>
        </section>

        {/* 3. VIP Room Teaser Banner (NO listings shown inside — subscribers must pay first) */}
        <section className="rounded-[18px] p-6 sm:p-8 text-white bg-gradient-to-br from-[#0F2C26] via-[#00594A] to-[#007A66] border border-brand-green/40 shadow-lg flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {t('vip_teaser_title') || '⭐ VIP Room — exclusive deals before anyone else'}
            </h2>
            <p className="text-sm sm:text-base text-white/90 mt-2 leading-relaxed">
              {t('vip_teaser_sub') ||
                'Subscribers see hidden, below-market and pre-launch listings 7 days before they go public, get instant WhatsApp & email alerts the moment a deal drops, and unlock contacts on VIP deals for free.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/vip-room')}
            className="px-6 py-3 rounded-[10px] bg-[#D3B42B] hover:bg-[#e0c138] text-[#1C2A24] font-bold text-sm sm:text-base cursor-pointer transition-colors shrink-0 shadow-sm"
          >
            {t('vip_teaser_btn') || 'Enter the VIP Room'} →
          </button>
        </section>

        {/* 4. How Guraaha Works */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink mb-1">
            {t('how')}
          </h2>
          <p className="text-brand-ink-soft text-sm sm:text-base mb-6">
            {t('how_sub')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-card p-6 border border-brand-line shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-lg mb-4">
                    {n}
                  </div>
                  <h4 className="font-bold text-base text-brand-ink mb-2">
                    {t(`h${n}t`)}
                  </h4>
                  <p className="text-xs sm:text-sm text-brand-ink-soft leading-relaxed">
                    {t(`h${n}p`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Monthly Lotto (Brand Green Gradient Only) & No-Smartphone Blocker Banner */}
        <section className="space-y-5">
          {/* Lotto Banner — Pure Brand Green Gradient */}
          <div className="rounded-[18px] p-6 sm:p-8 text-white bg-gradient-to-br from-[#00594A] to-[#007A66] flex flex-wrap items-center justify-between gap-6 shadow-md">
            <div className="max-w-xl">
              <span className="inline-block bg-white/15 border border-white/25 text-white px-3 py-1 rounded-full text-xs font-bold">
                🎟️ {t('lotto_badge')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2.5">
                {t('lotto_title')}
              </h2>
              <p className="text-sm text-white/90 mt-2 leading-relaxed">
                {t('lotto_sub')}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs uppercase tracking-wider opacity-85">
                {t('lotto_pool_lbl')}
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#F3DFA2] my-1">
                {Number(settings.lottoPrize || 250000).toLocaleString('en-US')} RWF
              </div>
              <button
                onClick={() => navigate('/membership')}
                className="mt-2 px-4 py-2 rounded-[9px] bg-white text-brand-green-dark font-semibold text-sm hover:bg-gray-100 cursor-pointer transition-colors"
              >
                {t('lotto_btn')}
              </button>
            </div>
          </div>

          {/* No Smartphone Banner */}
          <div className="bg-white border border-brand-line rounded-[14px] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <span className="inline-block bg-brand-bg-soft text-brand-green-dark border border-brand-line px-2.5 py-0.5 rounded-full text-xs font-semibold">
                📵 {t('nosmart_badge')}
              </span>
              <h3 className="text-lg font-bold text-brand-ink mt-1.5">
                {t('nosmart_title')}
              </h3>
              <p className="text-xs sm:text-sm text-brand-ink-soft mt-1 leading-relaxed">
                {t('nosmart_sub')}
              </p>
            </div>
            <button
              onClick={() => navigate('/partners')}
              className="px-4 py-2.5 rounded-[9px] border-2 border-brand-green text-brand-green font-semibold text-sm hover:bg-brand-green hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {t('nosmart_btn')} →
            </button>
          </div>
        </section>

        {/* 6. Latest Real-Estate News Strip (with Picture, Heading, Summary & Meta) */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">
                {t('news_strip_title')}
              </h2>
              <p className="text-brand-ink-soft text-sm sm:text-base mt-1">
                {t('news_strip_sub')}
              </p>
            </div>
            <button
              onClick={() => navigate('/news')}
              className="px-4 py-2 rounded-[9px] border-2 border-brand-green text-brand-green font-semibold text-sm hover:bg-brand-green hover:text-white transition-colors cursor-pointer"
            >
              {t('news_all_btn')} →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
            {newsItems.slice(0, 3).map((n) => {
              const imgUrl =
                n.image_url ||
                n.cover_image ||
                'https://images.unsplash.com/photo-1486325212027-8081e485255e?q=60&auto=format&fit=crop&w=900';
              const heading =
                (lang === 'rw' && n.title_rw) ||
                (lang === 'fr' && n.title_fr) ||
                n.title_en ||
                n.title;
              const dateStr =
                n.date ||
                (n.published_at
                  ? new Date(n.published_at).toLocaleDateString('en-RW', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '');
              return (
                <div
                  key={n.id}
                  onClick={() => navigate(`/news/${n.id}`)}
                  className="bg-white border border-brand-line rounded-[14px] overflow-hidden cursor-pointer hover:border-brand-green hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div
                      className="h-44 w-full bg-cover bg-center relative overflow-hidden bg-brand-bg-soft"
                      style={{ backgroundImage: `url('${imgUrl}')` }}
                    >
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-brand-green-dark text-xs font-bold shadow-xs">
                        {n.topic || n.tag || n.category || 'Market'}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="text-xs text-brand-ink-soft mb-1.5">
                        {dateStr} {n.read_time ? `· ${n.read_time} read` : ''}
                      </div>
                      <h4 className="font-bold text-base text-brand-ink leading-snug group-hover:text-brand-green transition-colors">
                        {heading}
                      </h4>
                      <p className="text-xs sm:text-sm text-brand-ink-soft mt-2 line-clamp-3 leading-relaxed">
                        {n.summary}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 pb-4 text-xs font-bold text-brand-green">
                    {t('news_read_article')} →
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
