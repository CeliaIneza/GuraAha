import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ListingCard } from '../components/ListingCard';
import { provinces } from '../data/mockData';
import { Search, Trophy, PhoneCall, ShieldCheck, Map, Eye, Lock } from 'lucide-react';

export const HomePage = () => {
  const { t, listings, totalUnlockedCount } = useApp();
  const navigate = useNavigate();

  const [selectedProv, setSelectedProv] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');

  const handleProvChange = (e) => {
    const val = e.target.value;
    setSelectedProv(val);
    setSelectedDist('');
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedProv) params.set('prov', selectedProv);
    if (selectedDist) params.set('dist', selectedDist);
    if (selectedType) params.set('type', selectedType);
    if (selectedPrice) params.set('price', selectedPrice);
    navigate(`/browse?${params.toString()}`);
  };

  const featuredListings = listings.filter(l => l.status === 'approved' && !l.vip).slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-[#00594A] to-[#007A66] text-white py-16 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-tight">
            {t('hero_title')}
          </h1>
          <p className="mt-4 text-base sm:text-lg opacity-90 max-w-xl leading-relaxed">
            {t('hero_sub')}
          </p>

          {/* SEARCH CARD */}
          <div className="bg-white text-brand-ink rounded-card p-4 sm:p-5 mt-8 shadow-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <select
              value={selectedProv}
              onChange={handleProvChange}
              className="p-3 border-1.5 border-brand-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand-green bg-white"
            >
              <option value="">Province</option>
              {Object.keys(provinces).map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>

            <select
              value={selectedDist}
              onChange={(e) => setSelectedDist(e.target.value)}
              className="p-3 border-1.5 border-brand-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand-green bg-white"
            >
              <option value="">District</option>
              {(provinces[selectedProv] || []).map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="p-3 border-1.5 border-brand-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand-green bg-white"
            >
              <option value="">Any type</option>
              <option value="land">Land</option>
              <option value="plot">Plot</option>
              <option value="house">House</option>
            </select>

            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              className="p-3 border-1.5 border-brand-line rounded-xl text-sm font-medium focus:outline-none focus:border-brand-green bg-white"
            >
              <option value="">Any price</option>
              <option value="5000000">&lt; 5M RWF</option>
              <option value="20000000">5M – 20M RWF</option>
              <option value="100000000">&gt; 20M RWF</option>
            </select>

            <button
              onClick={handleSearch}
              className="py-3 px-6 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md text-base"
            >
              <Search className="w-4 h-4" />
              {t('search')}
            </button>
          </div>

          {/* STATS */}
          <div className="flex flex-wrap gap-8 sm:gap-14 mt-10 text-white">
            <div>
              <b className="text-3xl font-bold block">1,248</b>
              <span className="text-xs sm:text-sm opacity-85">{t('st1')}</span>
            </div>
            <div>
              <b className="text-3xl font-bold block">316</b>
              <span className="text-xs sm:text-sm opacity-85">{t('st2')}</span>
            </div>
            <div>
              <b className="text-3xl font-bold block">30</b>
              <span className="text-xs sm:text-sm opacity-85">Districts</span>
            </div>
            <div>
              <b className="text-3xl font-bold block">{totalUnlockedCount.toLocaleString()}</b>
              <span className="text-xs sm:text-sm opacity-85">{t('st3')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="py-14 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">{t('feat')}</h2>
          <button
            onClick={() => navigate('/browse')}
            className="text-sm font-semibold text-brand-green hover:underline"
          >
            View all →
          </button>
        </div>
        <p className="text-brand-ink-soft text-sm sm:text-base mb-8">
          Fresh opportunities approved by our team
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {featuredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-brand-bg-soft py-14 px-6 sm:px-10 border-y border-brand-line">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink mb-1">{t('how')}</h2>
          <p className="text-brand-ink-soft text-sm sm:text-base mb-8">From search to handshake in four steps</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-card p-6 border border-brand-line shadow-sm">
              <div className="w-10 h-10 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-lg mb-4">
                1
              </div>
              <h4 className="font-bold text-base text-brand-ink mb-2">{t('h1t')}</h4>
              <p className="text-xs sm:text-sm text-brand-ink-soft leading-relaxed">{t('h1p')}</p>
            </div>

            <div className="bg-white rounded-card p-6 border border-brand-line shadow-sm">
              <div className="w-10 h-10 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-lg mb-4">
                2
              </div>
              <h4 className="font-bold text-base text-brand-ink mb-2">{t('h2t')}</h4>
              <p className="text-xs sm:text-sm text-brand-ink-soft leading-relaxed">{t('h2p')}</p>
            </div>

            <div className="bg-white rounded-card p-6 border border-brand-line shadow-sm">
              <div className="w-10 h-10 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-lg mb-4">
                3
              </div>
              <h4 className="font-bold text-base text-brand-ink mb-2">{t('h3t')}</h4>
              <p className="text-xs sm:text-sm text-brand-ink-soft leading-relaxed">{t('h3p')}</p>
            </div>

            <div className="bg-white rounded-card p-6 border border-brand-line shadow-sm">
              <div className="w-10 h-10 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-lg mb-4">
                4
              </div>
              <h4 className="font-bold text-base text-brand-ink mb-2">{t('h4t')}</h4>
              <p className="text-xs sm:text-sm text-brand-ink-soft leading-relaxed">{t('h4p')}</p>
            </div>
          </div>

          {/* LOTTO PROMO */}
          <div className="bg-[#0F2C26] text-white rounded-card p-6 sm:p-8 mt-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
            <div className="text-5xl">🎉</div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Monthly GuraAha Lotto</h3>
              <p className="text-sm opacity-90 leading-relaxed">
                Every contact unlock = one free entry. This month's prize: <b className="text-brand-gold">250,000 RWF</b> — drawn live on the 30th.
              </p>
            </div>
          </div>

          {/* NON-SMARTPHONE BANNER */}
          <div className="bg-[#F1E8D0] text-brand-ink rounded-card p-6 sm:p-8 mt-4 flex flex-col sm:flex-row items-center gap-6 border border-[#E5D7AF]">
            <div className="text-4xl">📞</div>
            <div>
              <h3 className="text-lg font-bold text-[#8B6F2E] mb-1">No smartphone? No problem.</h3>
              <p className="text-sm text-brand-ink-soft leading-relaxed">
                District representatives and nearby blockers assist buyers and sellers without smartphones — by phone call or in person. GuraAha works for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
