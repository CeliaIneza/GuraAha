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
  isRentListing,
  isFeaturedListing,
  listingCategory,
  listingSubType,
} from '../utils/listing';
import { Card } from './ui/card';

const fallbackImg =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80';

export const ListingCard = ({ listing, onClick, className }) => {
  const navigate = useNavigate();
  const { lang, t, tCat } = useApp();
  const [imgError, setImgError] = useState(false);

  const title = listingTitle(listing, lang) || 'Property Listing';
  const cover = listingCoverUrl(listing, 900) || fallbackImg;
  const price = listingPrice(listing);
  const size = listingSize(listing);
  const location = listingLocationLine(listing, ['sector', 'district']);
  const gradient = listingGradient(listing);
  const isRent = isRentListing(listing);
  const isFeatured = isFeaturedListing(listing);
  const cat = listingCategory(listing);
  const subType = listingSubType(listing);

  const catLabel = cat ? tCat(cat) : '';
  const subLabel = subType ? tCat(subType) : '';
  const typePillText =
    catLabel && subLabel && catLabel.toLowerCase() !== subLabel.toLowerCase()
      ? `${catLabel} · ${subLabel}`
      : catLabel || subLabel || tCat(listing?.type || 'Property');

  const handleClick = (e) => {
    if (onClick) {
      onClick(listing, e);
      return;
    }
    if (listing?.id) {
      navigate(`/listing/${listing.id}`, { state: { listing } });
    }
  };

  const handleTickerClick = (e) => {
    e.stopPropagation();
    navigate(`/browse?deal=${isRent ? 'rent' : 'sale'}`);
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'group cursor-pointer flex flex-col justify-between overflow-hidden rounded-card border border-brand-line bg-white shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(20,60,38,0.12)]',
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
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />

          {/* Top-Left Deal Ribbon Ticker: For sale (Green) / For rent (Blue) */}
          <button
            type="button"
            onClick={handleTickerClick}
            title={t('ticker_click_tip')}
            className={cn(
              'absolute top-2.5 left-0 z-10 inline-flex items-center gap-1.5 pl-3 pr-3.5 py-1.5 rounded-r-full text-white text-[11px] font-extrabold uppercase tracking-[0.8px] shadow-md transition-transform hover:translate-x-0.5 cursor-pointer',
              isRent
                ? 'bg-gradient-to-br from-[#2B4C7E] to-[#1D3559]'
                : 'bg-gradient-to-br from-[#007A66] to-[#00594A]'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/95 inline-block" />
            <span>{isRent ? t('deal_rent') : t('deal_sale')}</span>
          </button>

          {/* Top-Right Featured Badge */}
          {isFeatured && (
            <div className="pointer-events-none absolute top-2.5 right-2.5 z-10 rounded-full bg-gradient-to-br from-[#D3B42B] to-[#9E8419] px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#1C2A24] shadow-md">
              ★ {t('featured_badge')}
            </div>
          )}

          {size && (
            <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 rounded-md border border-white/10 bg-black/75 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              {size}
            </div>
          )}
        </div>

        <div className="space-y-2 p-[15px]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="rounded-full border border-brand-line bg-brand-bg-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-brand-green-dark truncate max-w-[165px]">
              {typePillText}
            </span>

            <span className="text-[17px] font-bold tracking-tight text-brand-green-dark">
              {price.toLocaleString('en-US')} RWF
              {isRent && (
                <span className="text-[11.5px] font-medium text-brand-ink-soft">
                  {t('per_month')}
                </span>
              )}
            </span>
          </div>

          <h3 className="text-[15.5px] font-semibold leading-snug text-brand-ink line-clamp-2">
            {title}
          </h3>

          {location && (
            <div className="flex items-center gap-1.5 pt-0.5 text-[13px] text-brand-ink-soft">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-green" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
