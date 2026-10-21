import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import {
  listingCoverUrl,
  listingGradient,
  listingLocationLine,
  listingPrice,
  listingSize,
  listingTitle,
} from '../utils/listing';
import { Card } from './ui/card';

const fallbackImg =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80';

export const ListingCard = ({ listing, onClick, className }) => {
  const navigate = useNavigate();
  const { lang } = useApp();
  const [imgError, setImgError] = useState(false);

  const title = listingTitle(listing, lang) || 'Property Listing';
  const cover = listingCoverUrl(listing, 900) || fallbackImg;
  const price = listingPrice(listing);
  const size = listingSize(listing);
  const location = listingLocationLine(listing, ['sector', 'district']);
  const gradient = listingGradient(listing);

  const handleClick = (e) => {
    if (onClick) {
      onClick(listing, e);
      return;
    }
    if (listing?.id) {
      navigate(`/listing/${listing.id}`, { state: { listing } });
    }
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'group cursor-pointer flex flex-col justify-between overflow-hidden rounded-card border border-brand-line bg-white shadow-none transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(20,60,38,0.12)]',
        className
      )}
    >
      <div>
        <div
          className="relative h-[180px] w-full overflow-hidden bg-brand-bg-soft"
          style={{ backgroundImage: gradient }}
        >
          <img
            src={imgError || !cover ? fallbackImg : cover}
            alt={title}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            loading="lazy"
          />

          {size && (
            <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 rounded-md border border-white/10 bg-black/75 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              {size}
            </div>
          )}
        </div>

        <div className="space-y-2.5 p-[15px]">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full border border-brand-line bg-brand-bg-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-green-dark">
              {listing?.type}
            </span>

            <span className="text-lg font-bold tracking-tight text-brand-green-dark">
              {price.toLocaleString('en-US')} RWF
            </span>
          </div>

          <h3 className="text-[15.5px] font-semibold leading-snug text-brand-ink line-clamp-2">
            {title}
          </h3>

          {location && (
            <div className="flex items-center gap-1.5 pt-0.5 text-[13px] text-brand-ink-soft">
              <MapPin className="h-4 w-4 shrink-0 text-brand-green" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
