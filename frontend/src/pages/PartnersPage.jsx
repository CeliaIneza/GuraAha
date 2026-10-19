import React, { useState, useEffect } from 'react';
import { partnersApi } from '../api/partners';
import { Award, Search, Phone, Mail, CheckCircle2, Loader2 } from 'lucide-react';

const TYPE_TABS = [
  { key: 'ALL', label: 'All Partners' },
  { key: 'SURVEYOR', label: 'Surveyors' },
  { key: 'NOTARY', label: 'Notaries' },
  { key: 'ENGINEER', label: 'Engineers' },
];

const getTypeIcon = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'surveyor':
      return '📐';
    case 'notary':
      return '⚖️';
    case 'engineer':
      return '🏗️';
    default:
      return '🏛️';
  }
};

const formatType = (type) => {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

export const PartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchPartners = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await partnersApi.getAll();
        if (isMounted) {
          setPartners(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load partners directory');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPartners();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPartners = partners.filter((p) => {
    const pType = (p.type || '').toUpperCase();
    if (selectedType !== 'ALL' && pType !== selectedType) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (p.name || '').toLowerCase();
      const loc = (p.location_name || p.locationName || '').toLowerCase();
      if (!name.includes(q) && !loc.includes(q)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-ink mb-2">Certified partners directory</h2>
          <p className="text-brand-ink-soft text-base">
            Licensed surveyors, notaries and engineers filtered by your district
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-brand-line rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-green bg-white shadow-sm"
          />
          <Search className="w-4 h-4 text-brand-ink-soft absolute left-3 top-3.5" />
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {TYPE_TABS.map((tab) => {
          const isActive = selectedType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedType(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-white text-brand-ink-soft border border-brand-line hover:border-brand-green hover:text-brand-green'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-brand-ink-soft">
          <Loader2 className="w-8 h-8 animate-spin text-brand-green mb-3" />
          <p className="text-sm font-medium">Loading certified partners...</p>
        </div>
      ) : filteredPartners.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPartners.map((partner) => {
            const locName = partner.location_name || partner.locationName;
            const desc =
              partner.description_en ||
              partner.descriptionEn ||
              partner.description_rw ||
              partner.descriptionRw ||
              partner.description_fr ||
              partner.descriptionFr;

            return (
              <div
                key={partner.id}
                className="bg-white border border-brand-line rounded-card p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl mb-2">{getTypeIcon(partner.type)}</div>
                  <h3 className="font-bold text-brand-ink text-lg leading-snug">{partner.name}</h3>
                  <p className="text-xs text-brand-ink-soft mb-3">
                    {formatType(partner.type)} {locName ? `· ${locName}` : ''}
                  </p>

                  {(partner.is_certified ?? partner.isCertified ?? true) && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E4F1EC] text-brand-green-dark mb-4">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                      Certified Partner
                    </span>
                  )}

                  {desc && (
                    <p className="text-xs text-brand-ink-soft leading-relaxed border-t border-brand-line/60 pt-3">
                      {desc}
                    </p>
                  )}

                  {(partner.phone || partner.email) && (
                    <div className="mt-4 pt-3 border-t border-brand-line/60 space-y-1.5 text-xs text-brand-ink-soft">
                      {partner.phone && (
                        <a
                          href={`tel:${partner.phone}`}
                          className="flex items-center gap-2 hover:text-brand-green transition-colors font-medium"
                        >
                          <Phone className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
                          <span>{partner.phone}</span>
                        </a>
                      )}
                      {partner.email && (
                        <a
                          href={`mailto:${partner.email}`}
                          className="flex items-center gap-2 hover:text-brand-green transition-colors font-medium truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
                          <span className="truncate">{partner.email}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 w-full py-2 bg-brand-bg-soft text-brand-ink font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-brand-line/50">
                  <Award className="w-3.5 h-3.5 text-brand-green" />
                  Verified Credentials
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-brand-line rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-brand-bg-soft flex items-center justify-center mx-auto text-brand-ink-soft mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-brand-ink mb-1">No certified partners listed yet</h3>
          <p className="text-sm text-brand-ink-soft max-w-md mx-auto">
            {searchQuery || selectedType !== 'ALL'
              ? 'Try adjusting your type filter or search term to find certified professionals.'
              : 'Our team is actively vetting surveyors, notaries, and engineers across Rwanda. Check back soon.'}
          </p>
        </div>
      )}
    </div>
  );
};
