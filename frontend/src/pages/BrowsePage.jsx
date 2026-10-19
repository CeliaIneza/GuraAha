import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListingCard } from '../components/ListingCard';
import { LocationCascade } from '../components/LocationCascade';
import { listingsApi } from '../api/listings';
import { Filter, RotateCcw, X, Loader2 } from 'lucide-react';

/* ─── FilterContent defined OUTSIDE BrowsePage to prevent remounting on parent re-renders ─── */
const FilterContent = ({ cascadeKey, typeFilter, maxPriceFilter, onLocationChange, onTypeChange, onPriceChange, onApply, onReset, isMobile = false }) => (
  <div className="space-y-5">
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Location</p>
      <LocationCascade
        key={`cascade-${cascadeKey}`}
        deepest="village"
        singleColumn
        onChange={({ locationId: id }) => onLocationChange(id)}
      />
    </div>

    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Property Type</label>
      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green bg-white transition-colors"
      >
        <option value="">All types</option>
        <option value="land">Land</option>
        <option value="house">House</option>
      </select>
    </div>

    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Max price (RWF)</label>
      <input
        type="number"
        value={maxPriceFilter}
        onChange={(e) => onPriceChange(e.target.value)}
        placeholder="e.g. 20,000,000"
        className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green transition-colors"
      />
    </div>

    {isMobile ? (
      <div className="pt-2 flex gap-3">
        <button onClick={onApply} className="flex-1 py-3.5 bg-brand-green hover:bg-brand-green-dark text-white rounded-xl text-sm font-semibold transition-colors">
          Apply filters
        </button>
        <button onClick={onReset} className="px-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
          Reset
        </button>
      </div>
    ) : (
      <button onClick={onApply} className="w-full py-3 bg-brand-green text-white rounded-xl text-sm font-semibold hover:bg-brand-green-dark transition-colors">
        Apply filters
      </button>
    )}
  </div>
);

export const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationId, setLocationId] = useState(searchParams.get('locationId') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [maxPriceFilter, setMaxPriceFilter] = useState(searchParams.get('price') || '');
  const [cascadeKey, setCascadeKey] = useState(0);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const load = async (params) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listingsApi.listApproved({
        locationId: params.locationId || undefined,
        type: params.type || undefined,
        maxPriceRwf: params.price || undefined,
        pageSize: 50,
      });
      setListings(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({
      locationId: searchParams.get('locationId') || '',
      type: searchParams.get('type') || '',
      price: searchParams.get('price') || '',
    });
  }, [searchParams]);

  const applyFilters = () => {
    const next = {};
    if (locationId) next.locationId = locationId;
    if (typeFilter) next.type = typeFilter;
    if (maxPriceFilter) next.price = maxPriceFilter;
    setSearchParams(next);
  };

  const handleReset = () => {
    setLocationId('');
    setTypeFilter('');
    setMaxPriceFilter('');
    setCascadeKey((n) => n + 1);
    setSearchParams({});
  };

  const handleApplyMobile = () => {
    applyFilters();
    setShowMobileFilter(false);
  };

  const handleResetMobile = () => {
    handleReset();
    setShowMobileFilter(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 min-h-[75vh]">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Filter Sidebar — stable width, never re-keyed */}
        <aside className="hidden md:block w-72 flex-shrink-0 bg-white border-2 border-gray-100 rounded-2xl p-5 h-fit sticky top-24 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg text-brand-ink flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-green" /> Filter
            </h3>
            <button onClick={handleReset} className="text-xs text-brand-green font-semibold hover:underline flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
          <FilterContent
            cascadeKey={cascadeKey}
            typeFilter={typeFilter}
            maxPriceFilter={maxPriceFilter}
            onLocationChange={setLocationId}
            onTypeChange={setTypeFilter}
            onPriceChange={setMaxPriceFilter}
            onApply={applyFilters}
            onReset={handleReset}
          />
        </aside>

        {/* Listings Main */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-brand-ink">
              Browse listings{' '}
              <span className="text-sm font-medium text-brand-ink-soft">
                {loading ? 'Loading…' : `(${listings.length})`}
              </span>
            </h2>
            <button
              onClick={() => setShowMobileFilter(true)}
              className="md:hidden flex items-center gap-2 text-sm font-semibold text-brand-ink border-2 border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-brand-green" /> Filter
            </button>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-brand-ink-soft">
              <Loader2 className="w-8 h-8 animate-spin text-brand-green mb-3" />
              <p className="text-sm font-medium">Finding listings across Rwanda...</p>
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-brand-bg-soft rounded-2xl p-12 text-center border-2 border-gray-100">
              <p className="text-brand-ink-soft text-base mb-3">No listings match these filters yet.</p>
              <button onClick={handleReset}
                className="px-4 py-2 bg-brand-green text-white rounded-xl text-sm font-semibold hover:bg-brand-green-dark transition-colors inline-flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Clear filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilter(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-lg text-brand-ink">Filter listings</h3>
              </div>
              <button onClick={() => setShowMobileFilter(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterContent
              cascadeKey={cascadeKey}
              typeFilter={typeFilter}
              maxPriceFilter={maxPriceFilter}
              onLocationChange={setLocationId}
              onTypeChange={setTypeFilter}
              onPriceChange={setMaxPriceFilter}
              onApply={handleApplyMobile}
              onReset={handleResetMobile}
              isMobile
            />
          </div>
        </div>
      )}
    </div>
  );
};
