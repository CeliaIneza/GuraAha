import { GRAD, IMG, XTRA, unsplashUrl } from '../data/mockData';

export function listingTitle(listing, lang = 'en') {
  if (!listing) return 'Untitled listing';
  const byLang = {
    en: listing.titleEn,
    rw: listing.titleRw,
    fr: listing.titleFr,
  };
  return byLang[lang] || listing.titleEn || listing.titleRw || listing.titleFr || listing.title || 'Untitled listing';
}

export function listingDescription(listing, lang = 'en') {
  if (!listing) return '';
  const byLang = {
    en: listing.descriptionEn,
    rw: listing.descriptionRw,
    fr: listing.descriptionFr,
  };
  return byLang[lang] || listing.descriptionEn || listing.descriptionRw || listing.descriptionFr || listing.desc || '';
}

export function listingSize(listing) {
  if (!listing) return '';
  if (listing.size) {
    return String(listing.size).replace(/\s*built/i, '').trim();
  }
  if (listing.sizeValue == null) return '';
  const unit = listing.sizeUnit || 'sqm';
  return `${Number(listing.sizeValue).toLocaleString('en-US')} ${unit}`;
}

export function listingLocationLine(listing, parts = ['sector', 'district']) {
  if (!listing) return '';
  const loc = listing.location || {};
  const fromNested = parts.map((key) => loc[key]).filter(Boolean).join(', ');
  if (fromNested) return fromNested;
  const dummyMap = {
    province: listing.prov,
    district: listing.dist,
    sector: listing.sect,
    cell: listing.cell,
    village: listing.vill,
  };
  return parts.map((key) => dummyMap[key]).filter(Boolean).join(', ');
}

export function listingPrice(listing) {
  return Number(listing?.price ?? listing?.priceRwf ?? 0);
}

export function listingCoverUrl(listing, width = 900) {
  if (!listing) return null;
  if (listing.image) return listing.image;
  const fromMedia = mediaUrl(listing.coverPhotoPath);
  if (fromMedia) return fromMedia;
  const photo = IMG[listing.id];
  if (photo) return unsplashUrl(photo, width);
  return null;
}

export function listingGradient(listing) {
  return GRAD[listing?.cls] || GRAD.t3;
}

export function listingGalleryUrls(listing) {
  const cover = listingCoverUrl(listing, 1400);
  const extras = XTRA.map((url) => unsplashUrl(url, 800));
  return [cover, ...extras].filter(Boolean);
}

export function blockerLabel(listing) {
  if (!listing) return 'Verified blocker';
  if (typeof listing.blocker === 'string' && listing.blocker) return listing.blocker;
  const blocker = listing.blocker || {};
  const name = [blocker.firstName, blocker.lastName].filter(Boolean).join(' ');
  if (blocker.verificationCode) {
    return `${name} · ${blocker.verificationCode}`;
  }
  return name || 'Verified blocker';
}

export function mediaUrl(path) {
  if (!path) return null;
  return path;
}

export function formatStatus(status) {
  if (!status) return '';
  return status.charAt(0) + status.slice(1).toLowerCase();
}
