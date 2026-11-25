import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListingCard } from '../components/ListingCard';
import { useApp } from '../context/AppContext';
import { listingsApi } from '../api/listings';
import { locationsApi } from '../api/locations';
import { initialListings } from '../data/mockData';
import {
  isFeaturedListing,
  isRentListing,
  listingCategory,
  listingPrice,
  listingSubType,
} from '../utils/listing';
import { Filter, RotateCcw, Search, ChevronDown, ChevronUp } from 'lucide-react';

const LEVELS = ['lbl_province', 'lbl_district', 'lbl_sector', 'lbl_cell', 'lbl_village'];

export const BrowsePage = () => {
  const { t, tCat, categories } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rawListings, setRawListings] = useState(initialListings);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Location cascade
  const [path, setPath] = useState([]);
  const [options, setOptions] = useState([[]]);

  // Filters synced with URL query params
  const [dealFilter, setDealFilter] = useState(searchParams.get('deal') || '');
  const [catFilter, setCatFilter] = useState(searchParams.get('category') || '');
  const [subTypeFilter, setSubTypeFilter] = useState(
    searchParams.get('subType') || searchParams.get('type') || ''
  );
  const [maxPriceFilter, setMaxPriceFilter] = useState(searchParams.get('price') || '');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'default');

  useEffect(() => {
    setDealFilter(searchParams.get('deal') || '');
    setCatFilter(searchParams.get('category') || '');
    setSubTypeFilter(searchParams.get('subType') || searchParams.get('type') || '');
    setMaxPriceFilter(searchParams.get('price') || '');
    if (searchParams.get('sort')) setSortOrder(searchParams.get('sort'));
  }, [searchParams]);

  // Load Provinces
  useEffect(() => {
    locationsApi
      .provinces()
      .then(({ data }) => setOptions([data || []]))
      .catch(() => {});
  }, []);

  const handleLevelChange = async (level, id) => {
    const nextPath = path.slice(0, level);
    nextPath[level] = id;
    setPath(nextPath);

    const nextOptions = options.slice(0, level + 1);
    setOptions(nextOptions);

    if (!id || level >= LEVELS.length - 1) return;

    try {
      const { data } = await locationsApi.children(id);
      setOptions([...nextOptions, data || []]);
    } catch {
      // ignore
    }
  };

  // Fetch approved listings from backend and merge with prototype listings if needed
  useEffect(() => {
    setLoading(true);
    const locId =
      [...path].reverse().find(Boolean) || searchParams.get('locationId') || undefined;

    listingsApi
      .listApproved({
        locationId: locId,
        pageSize: 100,
      })
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          if (locId) {
            setRawListings(data);
          } else {
            const existingIds = new Set(data.map((d) => String(d.id)));
            setRawListings([
              ...data,
              ...initialListings.filter((m) => !existingIds.has(String(m.id))),
            ]);
          }
        } else if (locId) {
          setRawListings([]);
        } else {
          setRawListings(initialListings);
        }
      })
      .catch(() => {
        setRawListings(initialListings);
      })
      .finally(() => setLoading(false));
  }, [searchParams, path]);

  const activeCategoryObj = useMemo(
    () =>
      categories.find(
        (c) =>
          String(c.slug).toLowerCase() === String(catFilter).toLowerCase() ||
          String(c.name_en).toLowerCase() === String(catFilter).toLowerCase()
      ),
    [categories, catFilter]
  );

  const subTypesForSelectedCat = useMemo(
    () => activeCategoryObj?.subtypes || activeCategoryObj?.subTypes || [],
    [activeCategoryObj]
  );

  // Filter and sort listings client-side for instant responsiveness
  const filteredListings = useMemo(() => {
    let list = rawListings.filter((l) => !l.vip && !l.is_vip && !l.isVip);

    if (dealFilter) {
      const wantRent = dealFilter.toLowerCase() === 'rent';
      list = list.filter((l) => isRentListing(l) === wantRent);
    }

    if (catFilter) {
      const targetSlug = String(catFilter).toLowerCase();
      const targetName = String(activeCategoryObj?.name_en || catFilter).toLowerCase();
      list = list.filter((l) => {
        const lCat = String(listingCategory(l) || '').toLowerCase();
        return lCat === targetSlug || lCat === targetName;
      });
    }

    if (subTypeFilter) {
      const targetSub = String(subTypeFilter).toLowerCase();
      list = list.filter((l) => {
        const lSub = String(listingSubType(l) || '').toLowerCase();
        const lType = String(l.type || '').toLowerCase();
        return lSub === targetSub || lType === targetSub;
      });
    }

    if (maxPriceFilter && !isNaN(Number(maxPriceFilter))) {
      const maxP = Number(maxPriceFilter);
      list = list.filter((l) => listingPrice(l) <= maxP);
    }

    // Apply Sort Order (Comment #5)
    const sorted = [...list];
    if (sortOrder === 'sale') {
      sorted.sort((a, b) => (isRentListing(a) === isRentListing(b) ? 0 : isRentListing(a) ? 1 : -1));
    } else if (sortOrder === 'rent') {
      sorted.sort((a, b) => (isRentListing(a) === isRentListing(b) ? 0 : isRentListing(a) ? -1 : 1));
    } else if (sortOrder === 'lo') {
      sorted.sort((a, b) => listingPrice(a) - listingPrice(b));
    } else if (sortOrder === 'hi') {
      sorted.sort((a, b) => listingPrice(b) - listingPrice(a));
    } else {
      // default: Featured first
      sorted.sort((a, b) =>
        isFeaturedListing(a) === isFeaturedListing(b) ? 0 : isFeaturedListing(a) ? -1 : 1
      );
    }

    return sorted;
  }, [rawListings, dealFilter, catFilter, activeCategoryObj, subTypeFilter, maxPriceFilter, sortOrder]);

  const updateUrlParams = (overrides = {}) => {
    const next = {};
    const locId = [...path].reverse().find(Boolean) || searchParams.get('locationId') || '';
    const d = overrides.deal !== undefined ? overrides.deal : dealFilter;
    const c = overrides.category !== undefined ? overrides.category : catFilter;
    const s = overrides.subType !== undefined ? overrides.subType : subTypeFilter;
    const p = overrides.price !== undefined ? overrides.price : maxPriceFilter;
    const so = overrides.sort !== undefined ? overrides.sort : sortOrder;

    if (locId) next.locationId = locId;
    if (d) next.deal = d;
    if (c) next.category = c;
    if (s) next.subType = s;
    if (p) next.price = p;
    if (so && so !== 'default') next.sort = so;
    setSearchParams(next);
  };

  const handleDealTabClick = (dealVal) => {
    setDealFilter(dealVal);
    updateUrlParams({ deal: dealVal });
  };

  const handleReset = () => {
    setPath([]);
    setOptions((prev) => [prev[0] || []]);
    setDealFilter('');
    setCatFilter('');
    setSubTypeFilter('');
    setMaxPriceFilter('');
    setSortOrder('default');
    setSearchParams({});
  };

  const activeFiltersCount = [
    dealFilter,
    catFilter,
    subTypeFilter,
    maxPriceFilter,
    ...path.filter(Boolean),
  ].filter(Boolean).length;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-5">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Filter Sidebar (Collapsible on mobile - Comment #2) */}
        <aside className="w-full md:w-72 md:shrink-0 bg-white border border-brand-line rounded-[14px] p-4 sm:p-5 shadow-xs md:sticky md:top-20">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base sm:text-lg text-brand-ink flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-green" />
              <span>{t('filter_title')}</span>
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-green text-white text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </h3>

            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-brand-green font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t('reset_btn')}
                </button>
              )}

              {/* Mobile Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen((o) => !o)}
                className="md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-line text-xs font-semibold text-brand-ink cursor-pointer"
              >
                <span>{t('filter_title')}</span>
                {mobileFilterOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className={`${mobileFilterOpen ? 'block' : 'hidden'} md:block space-y-3.5 mt-4`}>
            {/* Administrative Cascade: Province -> District -> Sector -> Cell -> Village */}
            {LEVELS.map((labelKey, i) => {
              if (i > 0 && !path[i - 1]) return null;
              const list = options[i] || [];
              if (i > 0 && list.length === 0) return null;
              return (
                <div key={labelKey}>
                  <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                    {t(labelKey)}
                  </label>
                  <select
                    value={path[i] || ''}
                    onChange={(e) => handleLevelChange(i, e.target.value)}
                    className="w-full h-10 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
                  >
                    <option value="">All</option>
                    {list.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}

            {/* Listing Type: All / For sale / For rent */}
            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                {t('filter_listing_type')}
              </label>
              <select
                value={dealFilter}
                onChange={(e) => {
                  setDealFilter(e.target.value);
                  updateUrlParams({ deal: e.target.value });
                }}
                className="w-full h-10 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              >
                <option value="">{t('deal_all')}</option>
                <option value="sale">{t('deal_sale')}</option>
                <option value="rent">{t('deal_rent')}</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                {t('filter_category')}
              </label>
              <select
                value={catFilter}
                onChange={(e) => {
                  setCatFilter(e.target.value);
                  setSubTypeFilter('');
                  updateUrlParams({ category: e.target.value, subType: '' });
                }}
                className="w-full h-10 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              >
                <option value="">{t('all_categories')}</option>
                {categories.map((c) => (
                  <option key={c.slug || c.id} value={c.slug || c.name_en}>
                    {tCat(c.slug || c.name_en)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-type (shown when selected category has sub-types) */}
            {subTypesForSelectedCat.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                  {t('filter_subtype')}
                </label>
                <select
                  value={subTypeFilter}
                  onChange={(e) => {
                    setSubTypeFilter(e.target.value);
                    updateUrlParams({ subType: e.target.value });
                  }}
                  className="w-full h-10 rounded-[9px] border border-brand-line bg-white px-3 text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
                >
                  <option value="">{t('all_subtypes')}</option>
                  {subTypesForSelectedCat.map((s) => (
                    <option key={s.slug || s.id} value={s.slug || s.name_en}>
                      {tCat(s.slug || s.name_en)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Max Price (RWF) */}
            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">
                {t('filter_max_price')}
              </label>
              <input
                type="number"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(e.target.value)}
                placeholder="e.g. 20000000"
                className="w-full h-10 px-3 border border-brand-line rounded-[9px] text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                updateUrlParams();
                setMobileFilterOpen(false);
              }}
              className="w-full h-10 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>{t('apply_filters')}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full h-9 rounded-[9px] border border-brand-line text-brand-ink-soft hover:text-brand-ink font-semibold text-xs cursor-pointer transition-colors"
            >
              {t('reset_btn')}
            </button>
          </div>
        </aside>

        {/* Results Main Section */}
        <main className="flex-1 min-w-0 w-full">
          {/* Top Bar: Title + Deal Segmented Tabs + Sort Select (Comment #5) */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
              {t('nav_browse')}{' '}
              <span className="text-sm font-normal text-brand-ink-soft">
                {loading ? 'Loading…' : `(${filteredListings.length} ${t('results_lbl')})`}
              </span>
            </h2>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Segmented Tabs: All | For sale | For rent */}
              <div className="inline-flex bg-white border border-brand-line rounded-[10px] p-1 gap-1">
                <button
                  type="button"
                  onClick={() => handleDealTabClick('')}
                  className={`px-3 py-1.5 rounded-[7px] text-xs font-bold cursor-pointer transition-colors ${
                    !dealFilter
                      ? 'bg-brand-green text-white'
                      : 'text-brand-ink-soft hover:text-brand-ink'
                  }`}
                >
                  {t('deal_all')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDealTabClick('sale')}
                  className={`px-3 py-1.5 rounded-[7px] text-xs font-bold cursor-pointer transition-colors ${
                    dealFilter === 'sale'
                      ? 'bg-brand-green text-white'
                      : 'text-brand-ink-soft hover:text-brand-ink'
                  }`}
                >
                  🏷️ {t('deal_sale')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDealTabClick('rent')}
                  className={`px-3 py-1.5 rounded-[7px] text-xs font-bold cursor-pointer transition-colors ${
                    dealFilter === 'rent'
                      ? 'bg-[#2B4C7E] text-white'
                      : 'text-brand-ink-soft hover:text-brand-ink'
                  }`}
                >
                  🔑 {t('deal_rent')}
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  updateUrlParams({ sort: e.target.value });
                }}
                aria-label="Sort listings"
                className="h-9 rounded-[10px] border border-brand-line bg-white px-3 text-xs sm:text-[13px] font-semibold text-brand-ink focus:outline-none focus:border-brand-green"
              >
                <option value="default">{t('sort_default')}</option>
                <option value="sale">{t('sort_sale')}</option>
                <option value="rent">{t('sort_rent')}</option>
                <option value="lo">{t('sort_price_lo')}</option>
                <option value="hi">{t('sort_price_hi')}</option>
              </select>
            </div>
          </div>

          {!loading && filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-8">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : !loading ? (
            <div className="bg-white rounded-[14px] p-12 text-center border border-brand-line">
              <p className="text-brand-ink-soft text-base mb-4">
                No listings match these filters yet.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-[9px] bg-brand-green text-white text-sm font-semibold cursor-pointer"
              >
                {t('reset_btn')}
              </button>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};