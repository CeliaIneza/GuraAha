export function listingTitle(listing, lang = 'en') {
  const byLang = {
    en: listing.titleEn,
    rw: listing.titleRw,
    fr: listing.titleFr,
  };
  return byLang[lang] || listing.titleEn || listing.titleRw || listing.titleFr || 'Untitled listing';
}

export function listingDescription(listing, lang = 'en') {
  const byLang = {
    en: listing.descriptionEn,
    rw: listing.descriptionRw,
    fr: listing.descriptionFr,
  };
  return byLang[lang] || listing.descriptionEn || listing.descriptionRw || listing.descriptionFr || '';
}

export function listingSize(listing) {
  if (listing.sizeValue == null) return '';
  const unit = listing.sizeUnit || 'sqm';
  return `${Number(listing.sizeValue).toLocaleString('en-US')} ${unit}`;
}

export function listingLocationLine(listing, parts = ['sector', 'district']) {
  const loc = listing.location || {};
  return parts.map((key) => loc[key]).filter(Boolean).join(', ');
}

export function blockerLabel(listing) {
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
