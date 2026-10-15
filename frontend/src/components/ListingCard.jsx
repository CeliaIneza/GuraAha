import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { listingLocationLine, listingSize, listingTitle, mediaUrl } from '../utils/listing';

export const ListingCard = ({ listing }) => {
  const navigate = useNavigate();
  const { lang } = useApp();
  const title = listingTitle(listing, lang);
  const cover = mediaUrl(listing.coverPhotoPath);
  const price = Number(listing.priceRwf || 0);

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="bg-white border border-brand-line rounded-card overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group flex flex-col h-full"
    >
      <div
        className="h-44 w-full relative overflow-hidden bg-emerald-900"
        style={cover ? { backgroundImage: `url('${cover}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-brand-ink backdrop-blur-sm shadow-sm capitalize">
          {listing.type}
        </span>
      </div>

      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="text-brand-green-dark font-bold text-lg mb-1">
            {price.toLocaleString('en-US')} RWF
          </div>
          <h3 className="font-semibold text-brand-ink text-base line-clamp-2 mb-2 group-hover:text-brand-green transition-colors">
            {title}
          </h3>
          <div className="text-xs text-brand-ink-soft flex items-center gap-1 mb-3">
            <MapPin className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
            <span>{listingLocationLine(listing) || listing.location?.village}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-brand-line/60 flex items-center justify-between">
          <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            listing.type === 'house'
              ? 'bg-[#F1E8D0] text-brand-earth'
              : 'bg-[#E4F1EC] text-brand-green-dark'
          }`}>
            {(listing.type || '').toUpperCase()}
          </span>
          <span className="text-xs text-brand-ink-soft font-medium">
            {listingSize(listing)}
          </span>
        </div>
      </div>
    </div>
  );
};
