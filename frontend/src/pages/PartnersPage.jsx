import React, { useState, useEffect, useMemo } from 'react';
import { partnersApi } from '../api/partners';
import { useApp } from '../context/AppContext';
import { RWANDA_30_DISTRICTS } from '../components/admin/PartnersTab';
import { Award, Search, Phone, Mail, CheckCircle2, Loader2, MapPin } from 'lucide-react';

const getTypeIcon = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'surveyor':
      return '📐';
    case 'notary':
      return '⚖️';
    case 'engineer':
      return '🏗️';
    case 'architect':
      return '🏛️';
    case 'valuer':
      return '📊';
    default:
      return '🏛️';
  }
};

const formatType = (type) => {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace('_', ' ');
};

export const PartnersPage = () => {
  const { t } = useApp();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const res = await partnersApi.getAll();
        if (isMounted) {
          const list = Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.data)
            ? res.data
            : [];
          setPartners(list.filter((p) => p.is_active !== false));
        }
      } catch {
        if (isMounted) setPartners([]);
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

  const TYPE_TABS = [
    { key: 'ALL', label: t('part_all') || 'All Partners' },
    { key: 'SURVEYOR', label: t('part_surveyors') || 'Surveyors' },
    { key: 'NOTARY', label: t('part_notaries') || 'Notaries' },
    { key: 'ENGINEER', label: t('part_engineers') || 'Engineers' },
  ];

  const availableDistricts = useMemo(() => {
    const set = new Set(RWANDA_30_DISTRICTS);
    partners.forEach((p) => {
      const d = p.district_name || p.location_name || p.locationName;
      if (d) set.add(d);
    });
    return Array.from(set);
  }, [partners]);

  const filteredPartners = partners.filter((p) => {
    if (p.is_active === false) return false;
    const pType = (p.type || '').toUpperCase();
    if (selectedType !== 'ALL' && pType !== selectedType) {
      return false;
    }

    const pDist = p.district_name || p.location_name || p.locationName || 'Kigali';
    if (selectedDistrict !== 'ALL' && pDist.toLowerCase() !== selectedDistrict.toLowerCase()) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (p.name || '').toLowerCase();
      const loc = pDist.toLowerCase();
      if (!name.includes(q) && !loc.includes(q)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink mb-2">
            {t('part_title')}
          </h2>
          <p className="text-brand-ink-soft text-sm sm:text-base">{t('part_sub')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="h-10 px-3 rounded-xl border border-brand-line bg-white text-sm font-medium text-brand-ink focus:outline-none focus:border-brand-green"
          >
            <option value="ALL">All Districts</option>
            {availableDistricts.map((d) => (
              <option key={d} value={d}>
                📍 {d} District
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search name or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-brand-line rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-green bg-white shadow-2xs"
            />
            <Search className="w-4 h-4 text-brand-ink-soft absolute left-3 top-3" />
          </div>
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
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-brand-green text-white shadow-xs'
                  : 'bg-white text-brand-ink-soft border border-brand-line hover:border-brand-green hover:text-brand-green'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-ink-soft">
          <Loader2 className="w-8 h-8 animate-spin text-brand-green mb-3" />
          <p className="text-sm font-medium">Loading certified partners...</p>
        </div>
      ) : filteredPartners.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredPartners.map((partner) => {
            const locName =
              partner.district_name || partner.location_name || partner.locationName || 'Gasabo';
            const cert = partner.certification_number || partner.certificationNumber;
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
                className="bg-white border border-brand-line rounded-card p-6 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{getTypeIcon(partner.type)}</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-bg-soft border border-brand-line text-xs font-bold text-brand-ink">
                      <MapPin className="w-3 h-3 text-brand-green" />
                      {locName.includes('District') ? locName : `${locName} District`}
                    </span>
                  </div>

                  <h3 className="font-bold text-brand-ink text-lg leading-snug">
                    {partner.name}
                  </h3>
                  <p className="text-xs font-semibold text-brand-green-dark mb-3">
                    {formatType(partner.type)} · Operating in {locName}
                  </p>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E4F1EC] text-brand-green-dark mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                    {cert ? `Certified · ${cert}` : t('part_verified')}
                  </span>

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

                {partner.phone ? (
                  <a
                    href={`tel:${partner.phone}`}
                    className="mt-6 w-full py-2.5 bg-white hover:bg-brand-green text-brand-green hover:text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 border-2 border-brand-green transition-colors"
                  >
                    <span>
                      {t('part_call')} {partner.phone}
                    </span>
                  </a>
                ) : (
                  <div className="mt-6 w-full py-2 bg-brand-bg-soft text-brand-ink font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-brand-line/50">
                    <Award className="w-3.5 h-3.5 text-brand-green" />
                    {t('part_verified')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-brand-line rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-brand-bg-soft flex items-center justify-center mx-auto text-brand-ink-soft mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-brand-ink mb-1">
            No certified partners found in this district
          </h3>
        </div>
      )}
    </div>
  );
};
