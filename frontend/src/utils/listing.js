import { GRAD, IMG, XTRA, unsplashUrl } from '../data/translations';
import { BACKEND_ORIGIN } from '../api/client';

export function listingTitle(listing, lang = 'en') {
  if (!listing) return 'Untitled listing';
  const titleEn = listing.titleEn || listing.title_en || listing.title || listing.t;
  const titleRw = listing.titleRw || listing.title_rw;
  const titleFr = listing.titleFr || listing.title_fr;
  const byLang = {
    en: titleEn,
    rw: titleRw,
    fr: titleFr,
  };
  return byLang[lang] || titleEn || titleRw || titleFr || 'Untitled listing';
}

export function listingDescription(listing, lang = 'en') {
  if (!listing) return '';
  const descEn = listing.descriptionEn || listing.description_en || listing.desc || listing.description;
  const descRw = listing.descriptionRw || listing.description_rw;
  const descFr = listing.descriptionFr || listing.description_fr;
  const byLang = {
    en: descEn,
    rw: descRw,
    fr: descFr,
  };
  return byLang[lang] || descEn || descRw || descFr || '';
}

export function isRentListing(listing) {
  const d = String(listing?.deal || 'sale').toLowerCase();
  return d === 'rent';
}

export function isFeaturedListing(listing) {
  return Boolean(listing?.is_featured ?? listing?.isFeatured ?? listing?.featured);
}

export function listingCategory(listing) {
  return listing?.category || listing?.cat || listing?.type || 'Land and Plots';
}

export function listingSubType(listing) {
  return listing?.sub_type || listing?.subType || listing?.type || listingCategory(listing);
}

export function listingTerms(listing, t) {
  if (isRentListing(listing)) {
    return listing?.rental_terms || listing?.rentalTerms || listing?.terms || (t ? t('monthly_rent') : 'Monthly rent');
  }
  return t ? t('outright_purchase') : 'Outright purchase · title transfer';
}

export function listingSize(listing) {
  if (!listing) return '';
  if (listing.size) {
    return String(listing.size).trim();
  }
  const sizeVal = listing.sizeValue ?? listing.size_value;
  if (sizeVal == null) return '';
  const unit = listing.sizeUnit || listing.size_unit || 'm²';
  const displayUnit = unit === 'sqm' ? 'm²' : unit;
  return `${Number(sizeVal).toLocaleString('en-US')} ${displayUnit}`;
}

export function listingLocationLine(listing, parts = ['sector', 'district']) {
  if (!listing) return '';
  const loc = listing.location || {};
  const fromNested = parts.map((key) => loc[key]).filter(Boolean).join(', ');
  if (fromNested) return fromNested;
  const dummyMap = {
    province: listing.prov || listing.province,
    district: listing.dist || listing.district,
    sector: listing.sect || listing.sector,
    cell: listing.cell,
    village: listing.vill || listing.village,
  };
  return parts.map((key) => dummyMap[key]).filter(Boolean).join(', ');
}

export function listingPrice(listing) {
  return Number(listing?.price ?? listing?.priceRwf ?? listing?.price_rwf ?? 0);
}

export function listingCoverUrl(listing, width = 900) {
  if (!listing) return null;
  if (listing.image) return listing.image;
  const coverPath =
    listing.coverPhotoPath ||
    listing.cover_photo_path ||
    (typeof listing.photos?.[0] === 'string' ? listing.photos[0] : listing.photos?.[0]?.file_path);
  const fromMedia = mediaUrl(coverPath);
  if (fromMedia) return fromMedia;
  const numId = Number(listing.id);
  const photo = IMG[numId] || IMG[(Math.abs(String(listing.id || '1').charCodeAt(0)) % 25) + 1];
  if (photo) return unsplashUrl(photo, width);
  return null;
}

export function listingGradient(listing) {
  return GRAD[listing?.cls] || GRAD.t3;
}

export function listingGalleryUrls(listing) {
  if (Array.isArray(listing?.photos) && listing.photos.length > 0) {
    const urls = listing.photos
      .map((p) => mediaUrl(typeof p === 'string' ? p : p.filePath || p.file_path))
      .filter(Boolean);
    if (urls.length > 0) return urls;
  }
  const coverPath = listing?.coverPhotoPath || listing?.cover_photo_path;
  if (coverPath) {
    return [mediaUrl(coverPath)].filter(Boolean);
  }
  const cover = listingCoverUrl(listing, 1400);
  const extras = XTRA.map((url) => unsplashUrl(url, 800));
  return [cover, ...extras].filter(Boolean);
}

export function blockerLabel(listing) {
  if (!listing) return 'Verified blocker';
  if (typeof listing.blocker === 'string' && listing.blocker) return listing.blocker;
  const blocker = listing.blocker || {};
  const firstName = blocker.firstName || blocker.first_name || listing.blocker_first_name;
  const lastName = blocker.lastName || blocker.last_name || listing.blocker_last_name;
  const code = blocker.verificationCode || blocker.verification_code || listing.blocker_verification_code;
  const shortLast = lastName ? `${lastName[0]}.` : '';
  const name = [firstName, shortLast].filter(Boolean).join(' ');
  if (code) {
    return name ? `${name} · ${code}` : `Blocker · ${code}`;
  }
  return name || 'Verified blocker';
}

export function mediaUrl(path) {
  if (!path) return null;
  const str = String(path).trim();
  if (!str) return null;
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:') || str.startsWith('blob:')) {
    return str;
  }
  if (str.startsWith('/uploads/')) {
    return `${BACKEND_ORIGIN}${str}`;
  }
  const clean = str.replace(/^\/+/, '');
  return `${BACKEND_ORIGIN}/uploads/${clean}`;
}

export function formatStatus(status) {
  if (!status) return '';
  return status.charAt(0) + status.slice(1).toLowerCase();
}
