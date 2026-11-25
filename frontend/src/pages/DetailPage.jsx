import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { listingsApi } from '../api/listings';
import { paymentsApi } from '../api/payments';
import { findDummyListing } from '../data/translations';
import {
  blockerLabel,
  isFeaturedListing,
  isRentListing,
  listingCategory,
  listingCoverUrl,
  listingDescription,
  listingGalleryUrls,
  listingGradient,
  listingPrice,
  listingSize,
  listingSubType,
  listingTerms,
  listingTitle,
  mediaUrl,
} from '../utils/listing';
import { Lock, Unlock, Phone, ChevronRight } from 'lucide-react';

export const DetailPage = () => {
  const { id } = useParams();
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { lang, t, tCat, openMoMo, settings, unlockTimestamp, getDistrictHighlight } = useApp();
  const { user } = useAuth();
  const [listing, setListing] = useState(
    routerLocation.state?.listing || findDummyListing(id) || null
  );
  const [photos, setPhotos] = useState(() => {
    const seed = routerLocation.state?.listing || findDummyListing(id);
    return seed ? listingGalleryUrls(seed) : [];
  });
  const [active, setActive] = useState('');
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    const dummy = routerLocation.state?.listing || findDummyListing(id);
    if (dummy) {
      const urls = listingGalleryUrls(dummy);
      setListing(dummy);
      setPhotos(urls);
      setActive(urls[0] || '');
      setError('');
    }

    const load = async () => {
      try {
        const [{ data }, photoRes] = await Promise.all([
          listingsApi.getById(id),
          listingsApi.getPhotos(id).catch(() => ({ data: [] })),
        ]);
        if (!data) return;
        setListing(data);
        const urls = (photoRes.data || [])
          .map((p) => mediaUrl(p.filePath || p.file_path))
          .filter(Boolean);
        const coverPath = data.coverPhotoPath || data.cover_photo_path;
        if (coverPath && !urls.includes(mediaUrl(coverPath))) {
          urls.unshift(mediaUrl(coverPath));
        }
        const gallery = urls.length > 0 ? urls : listingGalleryUrls(data);
        setPhotos(gallery);
        setActive(gallery[0] || '');
      } catch (err) {
        if (!dummy) setError(err.message || 'Listing not found');
      }
    };
    load();
  }, [id, routerLocation.state]);

  useEffect(() => {
    if (!user || !id) return;
    paymentsApi
      .getRevealedContact(id)
      .then((res) => {
        if (res?.data) {
          setRevealed(res.data);
        }
      })
      .catch(() => {});
  }, [id, user, unlockTimestamp]);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-brand-ink mb-4">{error}</h2>
        <Link to="/browse" className="text-brand-green font-semibold hover:underline">
          ← Return to Browse
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center text-brand-ink-soft">
        Loading listing…
      </div>
    );
  }

  const title = listingTitle(listing, lang);
  const loc = listing.location || {};
  const districtName = loc.district || listing.dist || '';
  const crumbs = [
    'Rwanda',
    loc.province || listing.prov,
    districtName,
    loc.sector || listing.sect,
    loc.cell || listing.cell,
    loc.village || listing.vill,
  ].filter(Boolean);

  const cover = active || listingCoverUrl(listing, 1400);
  const gradient = listingGradient(listing);
  const isRent = isRentListing(listing);
  const isFeatured = isFeaturedListing(listing);
  const cat = listingCategory(listing);
  const subType = listingSubType(listing);
  const terms = listingTerms(listing);
  const catLabel = cat ? tCat(cat) : '';
  const subLabel = subType ? tCat(subType) : '';

  // Area investment highlights from DB / AppContext
  const highlights =
    listing.area_highlights
      ? (() => {
          const raw =
            lang === 'rw' && listing.area_highlights.highlights_rw
              ? listing.area_highlights.highlights_rw
              : lang === 'fr' && listing.area_highlights.highlights_fr
              ? listing.area_highlights.highlights_fr
              : listing.area_highlights.highlights_en;
          return Array.isArray(raw) ? raw : [];
        })()
      : getDistrictHighlight(districtName);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 min-h-screen">
      {/* Breadcrumbs */}
      <div className="text-xs sm:text-sm text-brand-ink-soft mb-6 flex items-center gap-1.5 flex-wrap">
        {crumbs.map((crumb, idx) => (
          <span key={`${crumb}-${idx}`} className="flex items-center gap-1.5">
            {idx === 0 ? (
              <Link to="/" className="hover:underline">
                {crumb}
              </Link>
            ) : (
              <span
                className={idx === crumbs.length - 1 ? 'font-bold text-brand-green-dark' : ''}
              >
                {crumb}
              </span>
            )}
            {idx < crumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-10">
        {/* Left Column: Gallery + Specs + Description + Area Highlights */}
        <div className="md:col-span-3">
          <div
            className="relative w-full h-72 sm:h-96 rounded-card bg-cover bg-center shadow-md overflow-hidden"
            style={{
              backgroundImage: cover ? `url('${cover}'), ${gradient}` : gradient,
            }}
          >
            {/* Top-Left Deal Ribbon Ticker */}
            <button
              type="button"
              onClick={() => navigate(`/browse?deal=${isRent ? 'rent' : 'sale'}`)}
              title={t('ticker_click_tip')}
              className={`absolute top-3.5 left-0 z-10 inline-flex items-center gap-1.5 pl-3.5 pr-4 py-1.5 rounded-r-full text-white text-xs font-extrabold uppercase tracking-wider shadow-md cursor-pointer ${
                isRent
                  ? 'bg-gradient-to-br from-[#2B4C7E] to-[#1D3559]'
                  : 'bg-gradient-to-br from-[#007A66] to-[#00594A]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white inline-block" />
              <span>{isRent ? t('deal_rent') : t('deal_sale')}</span>
            </button>

            {isFeatured && (
              <div className=" absolute top-3.5 right-3.5 z-10 rounded-full bg-gradient-to-br from-[#D3B42B] to-[#9E8419] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#1C2A24] shadow-md">
                ★ {t('featured_badge')}
              </div>
            )}
          </div>

          {photos.length > 0 && (
            <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1">
              {photos.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActive(url)}
                  className={`flex-1 min-w-[76px] h-20 rounded-xl bg-cover bg-center cursor-pointer transition-all ${
                    active === url ? 'ring-3 ring-brand-green ring-offset-1' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundImage: `url('${url}'), ${gradient}` }}
                />
              ))}
            </div>
          )}

          {/* Deal + Category badges above title */}
          <div className="flex flex-wrap items-center gap-2 mt-6">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                isRent ? 'bg-[#E5ECF6] text-[#1D3559]' : 'bg-[#E0F2EE] text-[#00594A]'
              }`}
            >
              {isRent ? `🔑 ${t('deal_rent')}` : `🏷️ ${t('deal_sale')}`}
            </span>
            {catLabel && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-bg-soft border border-brand-line text-xs font-semibold text-brand-ink">
                {catLabel}
                {subLabel && subLabel.toLowerCase() !== catLabel.toLowerCase()
                  ? ` · ${subLabel}`
                  : ''}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink mt-2.5 mb-4">{title}</h1>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">{t('detail_size')}</span>
              <b className="text-sm sm:text-base text-brand-ink">{listingSize(listing) || ' '}</b>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">{t('detail_upi')}</span>
              <b className="text-sm sm:text-base text-brand-ink">
                {listing.upi_number || listing.upiNumber || listing.upi || ' '}
              </b>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">
                {t('detail_category')}
              </span>
              <b className="text-sm sm:text-base text-brand-ink">
                {catLabel || subLabel || tCat(listing.type)}
              </b>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">
                {t('detail_blocker')}
              </span>
              <b className="text-sm sm:text-base text-brand-ink">{blockerLabel(listing)} ✓</b>
            </div>
            {terms && (
              <div className="col-span-2 bg-white rounded-xl p-3.5 border border-brand-line">
                <span className="text-xs text-brand-ink-soft block mb-0.5">
                  {isRent ? t('detail_rental_terms') : t('detail_sale_terms')}
                </span>
                <b className="text-sm sm:text-base text-brand-ink">{terms}</b>
              </div>
            )}
          </div>

          <div className="mt-7">
            <h3 className="text-lg font-bold text-brand-ink mb-2">{t('detail_about')}</h3>
            <p className="text-sm sm:text-base text-brand-ink-soft leading-relaxed">
              {listingDescription(listing, lang) || 'No description provided.'}
            </p>
          </div>

          {/* Area Investment Highlights Box (from Prototype Detail Page) */}
          {highlights && highlights.length > 0 && (
            <div className="mt-7 bg-[#E0F2EE] border border-brand-line rounded-[14px] p-5">
              <h4 className="font-bold text-base text-[#00594A] mb-2">
               {t('detail_why_invest')} {districtName}
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-brand-ink">
                {highlights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Price & Contact Unlock Panel */}
        <div className="md:col-span-2">
          <div className="sticky top-24 bg-white border border-brand-line rounded-card p-6 shadow-md">
            <div className="text-2xl sm:text-3xl font-bold text-brand-green-dark mb-1">
              {listingPrice(listing).toLocaleString('en-US')} RWF
              {isRent && (
                <span className="text-sm font-medium text-brand-ink-soft">
                  {t('per_month')}
                </span>
              )}
            </div>
            {terms && (
              <div className="text-xs text-brand-ink-soft mb-5">{terms}</div>
            )}
            {!terms && <div className="mb-5" />}

            {(() => {
              const hasOwnerContact = Boolean(
                listing.hasOwnerContact ||
                  listing.has_owner_contact ||
                  listing.ownerPhone ||
                  listing.owner_phone ||
                  listing.owner ||
                  revealed?.ownerPhone ||
                  revealed?.owner_phone
              );
              return hasOwnerContact ? ['blocker', 'owner'] : ['blocker'];
            })().map((kind) => {
              const isUnlocked =
                kind === 'blocker'
                  ? Boolean(revealed?.blockerPhone || revealed?.blocker_phone)
                  : Boolean(revealed?.ownerPhone || revealed?.owner_phone);

              const phone =
                kind === 'blocker'
                  ? revealed?.blockerPhone || revealed?.blocker_phone
                  : revealed?.ownerPhone || revealed?.owner_phone;

              const name =
                kind === 'blocker'
                  ? blockerLabel(listing)
                  : revealed?.ownerName || revealed?.owner_name || 'Property Owner';

              const fee =
                kind === 'blocker' ? settings.blockerUnlockFee : settings.ownerUnlockFee;

              return (
                <div
                  key={kind}
                  className="mb-4 bg-brand-bg-soft border border-brand-line rounded-xl p-4"
                >
                  <h4 className="font-bold text-sm text-brand-ink flex items-center gap-2 mb-1">
                    {isUnlocked ? (
                      <Unlock className="w-4 h-4 text-brand-green" />
                    ) : (
                      <Lock className="w-4 h-4 text-brand-green" />
                    )}
                    {kind === 'blocker' ? t('detail_blocker_contact') : t('detail_owner_contact')}
                  </h4>
                  <p className="text-xs text-brand-ink-soft mb-3">
                    {kind === 'blocker' ? t('detail_blocker_desc') : t('detail_owner_desc')}
                  </p>
                  {isUnlocked ? (
                    <div className="bg-white border border-brand-green/30 rounded-xl p-3 space-y-1">
                      <div className="text-xs text-brand-ink-soft font-medium">{name}</div>
                      <a
                        href={`tel:${phone}`}
                        className="inline-flex items-center gap-2 text-base font-bold text-brand-green-dark hover:underline font-mono"
                      >
                        <Phone className="w-4 h-4" />
                        {phone}
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        openMoMo({
                          kind,
                          listingId: listing.id,
                          amount: fee,
                          title,
                        })
                      }
                      className={`w-full py-2.5 text-white font-semibold rounded-xl text-sm cursor-pointer transition-colors ${
                        kind === 'blocker'
                          ? 'bg-brand-green hover:bg-brand-green-dark'
                          : 'bg-brand-earth hover:bg-amber-800'
                      }`}
                    >
                      {t('unlock_for')} {Number(fee).toLocaleString('en-US')} RWF
                    </button>
                  )}
                </div>
              );
            })}

            <div className="text-xs text-brand-ink-soft bg-brand-bg-soft p-3 rounded-lg border border-brand-line leading-relaxed">
             {t('detail_lotto_note')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
