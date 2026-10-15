import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListingCard } from '../components/ListingCard';
import { LocationCascade } from '../components/LocationCascade';
import { listingsApi } from '../api/listings';
import { Filter, RotateCcw } from 'lucide-react';

export const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationId, setLocationId] = useState(searchParams.get('locationId') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [maxPriceFilter, setMaxPriceFilter] = useState(searchParams.get('price') || '');
  const [cascadeKey, setCascadeKey] = useState(0);

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

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10 min-h-[75vh]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 bg-white border border-brand-line rounded-card p-5 h-fit sticky top-24 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-brand-ink flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-green" />
              Filter
            </h3>
            <button onClick={handleReset} className="text-xs text-brand-green font-semibold hover:underline flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="space-y-4">
            <LocationCascade key={cascadeKey} deepest="village" onChange={({ locationId: id }) => setLocationId(id)} />

            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green bg-white"
              >
                <option value="">All types</option>
                <option value="land">Land</option>
                <option value="house">House</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Max price (RWF)</label>
              <input
                type="number"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(e.target.value)}
                placeholder="e.g. 20000000"
                className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
              />
            </div>

            <button
              onClick={applyFilters}
              className="w-full py-2.5 bg-brand-green text-white rounded-xl text-sm font-semibold hover:bg-brand-green-dark"
            >
              Apply filters
            </button>
          </div>
        </aside>

        <main className="md:col-span-3">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-brand-line">
            <h2 className="text-2xl font-bold text-brand-ink">
              Browse listings{' '}
              <span className="text-sm font-medium text-brand-ink-soft">
                {loading ? 'Loading…' : `${listings.length} results`}
              </span>
            </h2>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          {!loading && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : !loading ? (
            <div className="bg-brand-bg-soft rounded-card p-12 text-center border border-brand-line">
              <p className="text-brand-ink-soft text-base">
                No listings match these filters yet.
              </p>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};
