import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IMG } from '../data/mockData';
import { MapPin } from 'lucide-react';

export const ListingCard = ({ listing }) => {
  const navigate = useNavigate();

  const formattedPrice = (price) => `${price.toLocaleString('en-US')} RWF`;

  const bgStyle = {
    backgroundImage: `url('${IMG[listing.id]}?q=60&auto=format&fit=crop&w=800')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="bg-white border border-brand-line rounded-card overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group flex flex-col h-full"
    >
      <div className="h-44 w-full relative overflow-hidden bg-emerald-900" style={bgStyle}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-brand-ink backdrop-blur-sm shadow-sm capitalize">
          {listing.ic} {listing.type}
        </span>
      </div>

      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="text-brand-green-dark font-bold text-lg mb-1">
            {formattedPrice(listing.price)}
          </div>
          <h3 className="font-semibold text-brand-ink text-base line-clamp-2 mb-2 group-hover:text-brand-green transition-colors">
            {listing.title}
          </h3>
          <div className="text-xs text-brand-ink-soft flex items-center gap-1 mb-3">
            <MapPin className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
            <span>{listing.sect}, {listing.dist}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-brand-line/60 flex items-center justify-between">
          <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            listing.type === 'house'
              ? 'bg-[#F1E8D0] text-brand-earth'
              : 'bg-[#E4F1EC] text-brand-green-dark'
          }`}>
            {listing.type.toUpperCase()}
          </span>
          <span className="text-xs text-brand-ink-soft font-medium">
            {listing.size}
          </span>
        </div>
      </div>
    </div>
  );
};
