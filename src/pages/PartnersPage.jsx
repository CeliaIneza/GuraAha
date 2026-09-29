import React, { useState } from 'react';
import { certifiedPartners } from '../data/mockData';
import { Award, Search } from 'lucide-react';

export const PartnersPage = () => {
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const filteredPartners = certifiedPartners.filter((p) => {
    if (selectedDistrict && !p.district.toLowerCase().includes(selectedDistrict.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-ink mb-2">Certified partners directory</h2>
          <p className="text-brand-ink-soft text-base">
            Licensed surveyors, notaries and engineers — filtered by your district
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Filter by district..."
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border-1.5 border-brand-line rounded-xl text-sm text-brand-ink focus:outline-none focus:border-brand-green"
          />
          <Search className="w-4 h-4 text-brand-ink-soft absolute left-3 top-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {filteredPartners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white border border-brand-line rounded-card p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="text-3xl mb-2">{partner.icon}</div>
              <h3 className="font-bold text-brand-ink text-lg">{partner.name}</h3>
              <p className="text-xs text-brand-ink-soft mb-3">{partner.role} · {partner.district}</p>

              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E4F1EC] text-brand-green-dark mb-4">
                {partner.cert}
              </span>

              <p className="text-xs text-brand-ink-soft leading-relaxed border-t border-brand-line/60 pt-3">
                {partner.desc}
              </p>
            </div>

            <button className="mt-6 w-full py-2 bg-brand-bg-soft hover:bg-brand-line text-brand-ink font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-brand-green" />
              Verify Credentials
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
