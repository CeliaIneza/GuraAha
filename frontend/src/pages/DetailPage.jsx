import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { listingsApi } from '../api/listings';
import { paymentsApi } from '../api/payments';
import { findDummyListing } from '../data/mockData';
import {
  blockerLabel,
  listingCoverUrl,
  listingDescription,
  listingGalleryUrls,
  listingGradient,
  listingPrice,
  listingSize,
  listingTitle,
  mediaUrl,
} from '../utils/listing';
import { Lock, Unlock, Phone, ChevronRight } from 'lucide-react';

export const DetailPage = () => {
  const { id } = useParams();
  const routerLocation = useLocation();
  const { lang, openMoMo, settings, unlockTimestamp } = useApp();
  const { user } = useAuth();
  const [listing, setListing] = useState(routerLocation.state?.listing || findDummyListing(id) || null);
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
    return <div className="max-w-4xl mx-auto px-6 py-20 text-center text-brand-ink-soft">Loading listing…</div>;
  }

  const title = listingTitle(listing, lang);
  const loc = listing.location || {};
  const crumbs = [
    'Rwanda',
    loc.province || listing.prov,
    loc.district || listing.dist,
    loc.sector || listing.sect,
    loc.cell || listing.cell,
    loc.village || listing.vill,
  ].filter(Boolean);
  const cover = active || listingCoverUrl(listing, 1400);
  const gradient = listingGradient(listing);

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 min-h-screen">
      <div className="text-xs sm:text-sm text-brand-ink-soft mb-6 flex items-center gap-1.5 flex-wrap">
        {crumbs.map((crumb, idx) => (
          <span key={`${crumb}-${idx}`} className="flex items-center gap-1.5">
            {idx === 0 ? <Link to="/" className="hover:underline">{crumb}</Link> : <span className={idx === crumbs.length - 1 ? 'font-bold text-brand-green-dark' : ''}>{crumb}</span>}
            {idx < crumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-3">
          <div
            className="w-full h-80 sm:h-96 rounded-card bg-cover bg-center shadow-md"
            style={{
              backgroundImage: cover ? `url('${cover}'), ${gradient}` : gradient,
            }}
          />
          {photos.length > 0 && (
            <div className="flex gap-3 mt-3">
              {photos.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActive(url)}
                  className={`flex-1 h-20 rounded-xl bg-cover bg-center ${active === url ? 'ring-4 ring-brand-green ring-offset-2' : 'opacity-80'}`}
                  style={{ backgroundImage: `url('${url}'), ${gradient}` }}
                />
              ))}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink mt-6 mb-4">{title}</h1>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-brand-bg-soft rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">Size</span>
              <b className="text-base text-brand-ink">{listingSize(listing) || ' '}</b>
            </div>
            <div className="bg-brand-bg-soft rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">UPI / Parcel No.</span>
              <b className="text-base text-brand-ink">{listing.upi_number || listing.upiNumber || listing.upi || ' '}</b>
            </div>
            <div className="bg-brand-bg-soft rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">Type</span>
              <b className="text-base text-brand-ink capitalize">{(listing.type || '').toLowerCase()}</b>
            </div>
            <div className="bg-brand-bg-soft rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">Verified blocker</span>
              <b className="text-base text-brand-ink">{blockerLabel(listing)}</b>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-bold text-brand-ink mb-2">About this property</h3>
            <p className="text-sm sm:text-base text-brand-ink-soft leading-relaxed">
              {listingDescription(listing, lang) || 'No description provided.'}
            </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="sticky top-24 bg-white border-1.5 border-brand-line rounded-card p-6 shadow-md">
            <div className="text-3xl font-bold text-brand-green-dark mb-6">
              {listingPrice(listing).toLocaleString('en-US')} RWF
            </div>

            {(() => {
              const hasOwnerContact = Boolean(
                listing.hasOwnerContact ||
                  listing.has_owner_contact ||
                  listing.ownerPhone ||
                  listing.owner_phone ||
                  revealed?.ownerPhone ||
                  revealed?.owner_phone
              );
              const availableKinds = hasOwnerContact ? ['blocker', 'owner'] : ['blocker'];
              return availableKinds;
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

              return (
                <div key={kind} className="mb-4 bg-brand-bg-soft border border-brand-line rounded-xl p-4">
                  <h4 className="font-bold text-sm text-brand-ink flex items-center gap-2 mb-1">
                    {isUnlocked ? (
                      <Unlock className="w-4 h-4 text-brand-green" />
                    ) : (
                      <Lock className="w-4 h-4 text-brand-green" />
                    )}
                    {kind === 'blocker' ? 'Blocker (agent) contact' : 'Owner contact'}
                  </h4>
                  <p className="text-xs text-brand-ink-soft mb-3">
                    {kind === 'blocker'
                      ? 'Talk to the verified local agent managing this property.'
                      : 'Deal directly with the property owner.'}
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
                          amount: kind === 'blocker' ? settings.blockerUnlockFee : settings.ownerUnlockFee,
                          title,
                        })
                      }
                      className={`w-full py-2.5 text-white font-semibold rounded-xl text-sm ${
                        kind === 'blocker' ? 'bg-brand-green hover:bg-brand-green-dark' : 'bg-brand-earth hover:bg-amber-800'
                      }`}
                    >
                      Unlock for {(kind === 'blocker' ? settings.blockerUnlockFee : settings.ownerUnlockFee).toLocaleString('en-US')} RWF
                    </button>
                  )}
                </div>
              );
            })}

            <div className="text-xs text-brand-ink-soft bg-brand-bg-soft p-3 rounded-lg border border-brand-line leading-relaxed">
              Every contact unlock grants automatic entry into the GuraAha Monthly Lotto draw. VIP Room &amp; Unlock Pass subscribers unlock contacts for free.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
