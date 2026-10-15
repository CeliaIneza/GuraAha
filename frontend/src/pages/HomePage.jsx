import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ListingCard } from '../components/ListingCard';
import { LocationCascade } from '../components/LocationCascade';
import { listingsApi } from '../api/listings';
import { Search } from 'lucide-react';

export const HomePage = () => {
  const { t } = useApp();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [locationId, setLocationId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    listingsApi
      .listApproved({ pageSize: 4 })
      .then(({ data }) => setListings(data || []))
      .catch((err) => setError(err.message));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (locationId) params.set('locationId', locationId);
    if (selectedType) params.set('type', selectedType);
    if (selectedPrice) params.set('price', selectedPrice);
    navigate(`/browse?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-[#00594A] to-[#007A66] text-white py-16 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-tight">
            {t('hero_title')}
          </h1>
          <p className="mt-4 text-base sm:text-lg opacity-90 max-w-xl leading-relaxed">
            {t('hero_sub')}
          </p>

          <div className="bg-white text-brand-ink rounded-card p-4 sm:p-5 mt-8 shadow-2xl space-y-3">
            <LocationCascade deepest="district" onChange={({ locationId: id }) => setLocationId(id)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="p-3 border-1.5 border-brand-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand-green bg-white"
              >
                <option value="">Any type</option>
                <option value="land">Land</option>
                <option value="house">House</option>
              </select>

              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="p-3 border-1.5 border-brand-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand-green bg-white"
              >
                <option value="">Any price</option>
                <option value="5000000">&lt; 5M RWF</option>
                <option value="20000000">&lt; 20M RWF</option>
                <option value="100000000">&lt; 100M RWF</option>
              </select>

              <button
                onClick={handleSearch}
                className="py-3 px-6 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md text-base"
              >
                <Search className="w-4 h-4" />
                {t('search')}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 sm:gap-14 mt-10 text-white">
            <div>
              <b className="text-3xl font-bold block">{listings.length}</b>
              <span className="text-xs sm:text-sm opacity-85">{t('st1')} on this page</span>
            </div>
            <div>
              <b className="text-3xl font-bold block">30</b>
              <span className="text-xs sm:text-sm opacity-85">Districts</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">{t('feat')}</h2>
          <button onClick={() => navigate('/browse')} className="text-sm font-semibold text-brand-green hover:underline">
            View all →
          </button>
        </div>
        <p className="text-brand-ink-soft text-sm sm:text-base mb-8">
          Fresh opportunities approved by our team
        </p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="bg-brand-bg-soft rounded-card p-10 text-center border border-brand-line text-brand-ink-soft">
            No approved listings yet. Approved blocker posts will appear here.
          </div>
        )}
      </section>

      <section className="bg-brand-bg-soft py-14 px-6 sm:px-10 border-y border-brand-line">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink mb-1">{t('how')}</h2>
          <p className="text-brand-ink-soft text-sm sm:text-base mb-8">From search to handshake in four steps</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-card p-6 border border-brand-line shadow-sm">
                <div className="w-10 h-10 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-lg mb-4">
                  {n}
                </div>
                <h4 className="font-bold text-base text-brand-ink mb-2">{t(`h${n}t`)}</h4>
                <p className="text-xs sm:text-sm text-brand-ink-soft leading-relaxed">{t(`h${n}p`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
