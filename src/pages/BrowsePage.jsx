import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ListingCard } from '../components/ListingCard';
import { provinces, sectorsByDistrict } from '../data/mockData';
import { Filter, RotateCcw } from 'lucide-react';

export const BrowsePage = () => {
  const { listings } = useApp();
  const [searchParams] = useSearchParams();

  const [provFilter, setProvFilter] = useState(searchParams.get('prov') || '');
  const [distFilter, setDistFilter] = useState(searchParams.get('dist') || '');
  const [sectFilter, setSectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [maxPriceFilter, setMaxPriceFilter] = useState(searchParams.get('price') || '');

  useEffect(() => {
    if (searchParams.get('prov')) setProvFilter(searchParams.get('prov'));
    if (searchParams.get('dist')) setDistFilter(searchParams.get('dist'));
    if (searchParams.get('type')) setTypeFilter(searchParams.get('type'));
    if (searchParams.get('price')) setMaxPriceFilter(searchParams.get('price'));
  }, [searchParams]);

  const handleProvChange = (e) => {
    setProvFilter(e.target.value);
    setDistFilter('');
    setSectFilter('');
  };

  const handleDistChange = (e) => {
    setDistFilter(e.target.value);
    setSectFilter('');
  };

  const handleReset = () => {
    setProvFilter('');
    setDistFilter('');
    setSectFilter('');
    setTypeFilter('');
    setMaxPriceFilter('');
  };

  const filteredListings = listings.filter((l) => {
    if (l.status !== 'approved') return false;
    if (provFilter && l.prov !== provFilter) return false;
    if (distFilter && l.dist !== distFilter) return false;
    if (sectFilter && l.sect !== sectFilter) return false;
    if (typeFilter && l.type !== typeFilter) return false;
    if (maxPriceFilter && l.price > parseInt(maxPriceFilter, 10)) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10 min-h-[75vh]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* SIDEBAR FILTERS */}
        <aside className="md:col-span-1 bg-white border border-brand-line rounded-card p-5 h-fit sticky top-24 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-brand-ink flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-green" />
              Filter
            </h3>
            {(provFilter || distFilter || typeFilter || maxPriceFilter) && (
              <button
                onClick={handleReset}
                className="text-xs text-brand-green font-semibold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Province</label>
              <select
                value={provFilter}
                onChange={handleProvChange}
                className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green bg-white"
              >
                <option value="">All provinces</option>
                {Object.keys(provinces).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">District</label>
              <select
                value={distFilter}
                onChange={handleDistChange}
                className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green bg-white"
              >
                <option value="">All districts</option>
                {(provinces[provFilter] || []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Sector</label>
              <select
                value={sectFilter}
                onChange={(e) => setSectFilter(e.target.value)}
                className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green bg-white"
              >
                <option value="">All sectors</option>
                {(sectorsByDistrict[distFilter] || ["Remera", "Kimironko", "Gisozi", "Muhoza", "Gisenyi"]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-ink-soft mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2.5 border-1.5 border-brand-line rounded-xl text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green bg-white"
              >
                <option value="">All types</option>
                <option value="land">Land</option>
                <option value="plot">Plot</option>
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
          </div>

          <div className="mt-6 p-3 bg-brand-bg-soft rounded-lg text-xs text-brand-ink-soft leading-relaxed border border-brand-line">
            Cascading selects mirror Rwanda's 5-level location structure (Province → District → Sector → Cell → Village).
          </div>
        </aside>

        {/* LISTINGS GRID & COUNT */}
        <main className="md:col-span-3">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-brand-line">
            <h2 className="text-2xl font-bold text-brand-ink">
              Browse listings{' '}
              <span className="text-sm font-medium text-brand-ink-soft">
                — {filteredListings.length} results
              </span>
            </h2>
          </div>

          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-brand-bg-soft rounded-card p-12 text-center border border-brand-line">
              <p className="text-brand-ink-soft text-base">
                No listings match these filters yet. Try expanding your search criteria!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
