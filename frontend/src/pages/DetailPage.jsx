import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { listingsApi } from '../api/listings';
import { paymentsApi } from '../api/payments';
import { blockerLabel, listingDescription, listingSize, listingTitle, mediaUrl } from '../utils/listing';
import { Lock, ChevronRight, Unlock, Loader2 } from 'lucide-react';

export const DetailPage = () => {
  const { id } = useParams();
  const { lang, openMoMo, settings, unlockTimestamp } = useApp();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [active, setActive] = useState('');
  const [error, setError] = useState('');

  // Revealed contacts from the backend — shape: { blockerPhone, ownerPhone, ownerName }
  const [revealedContacts, setRevealedContacts] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [copiedType, setCopiedType] = useState(null);

  // Load listing details + photos
  useEffect(() => {
    const load = async () => {
      try {
        const [{ data }, photoRes] = await Promise.all([
          listingsApi.getById(id),
          listingsApi.getPhotos(id).catch(() => ({ data: [] })),
        ]);
        setListing(data);
        const urls = (photoRes.data || []).map((p) => mediaUrl(p.filePath || p.file_path)).filter(Boolean);
        if (data.coverPhotoPath && !urls.includes(data.coverPhotoPath)) {
          urls.unshift(mediaUrl(data.coverPhotoPath));
        }
        setPhotos(urls);
        setActive(urls[0] || '');
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, [id]);

  // Load revealed contacts — re-runs when user logs in or after a successful unlock
  useEffect(() => {
    if (!user || !id) {
      setRevealedContacts(null);
      setContactsLoading(false);
      return;
    }

    let isMounted = true;
    const loadContacts = async () => {
      setContactsLoading(true);
      try {
        const res = await paymentsApi.getRevealedContact(id);
        if (isMounted) {
          // res.data shape: { blockerPhone?, ownerPhone?, ownerName? }
          setRevealedContacts(res?.data || {});
        }
      } catch (err) {
        // 404 means no unlocks yet — that's fine
        if (isMounted) {
          setRevealedContacts({});
        }
      } finally {
        if (isMounted) setContactsLoading(false);
      }
    };

    loadContacts();
    return () => { isMounted = false; };
  }, [id, user, unlockTimestamp]);

  const handleCopyContact = (phone, type) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

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
  const crumbs = ['Rwanda', loc.province, loc.district, loc.sector, loc.cell, loc.village].filter(Boolean);

  // Owner info visibility — only show owner unlock if owner phone was provided
  const hasOwnerInfo = Boolean(
    listing.ownerPhone || listing.owner_phone ||
    (revealedContacts && revealedContacts.ownerPhone)
  );

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 min-h-screen">
      <div className="text-xs sm:text-sm text-brand-ink-soft mb-6 flex items-center gap-1.5 flex-wrap">
        {crumbs.map((crumb, idx) => (
          <span key={`${crumb}-${idx}`} className="flex items-center gap-1.5">
            {idx === 0 ? (
              <Link to="/" className="hover:underline">
                {crumb}
              </Link>
            ) : (
              <span className={idx === crumbs.length - 1 ? 'font-bold text-brand-green-dark' : ''}>{crumb}</span>
            )}
            {idx < crumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-3">
          <div
            className="w-full h-80 sm:h-96 rounded-card bg-slate-900 bg-cover bg-center shadow-md"
            style={active ? { backgroundImage: `url('${active}')` } : undefined}
          />
          {photos.length > 0 && (
            <div className="flex gap-3 mt-3">
              {photos.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActive(url)}
                  className={`flex-1 h-20 rounded-xl bg-cover bg-center ${
                    active === url ? 'ring-4 ring-brand-green ring-offset-2' : 'opacity-80'
                  }`}
                  style={{ backgroundImage: `url('${url}')` }}
                />
              ))}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink mt-6 mb-4">{title}</h1>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-brand-bg-soft rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">Size</span>
              <b className="text-base text-brand-ink">{listingSize(listing)}</b>
            </div>
            <div className="bg-brand-bg-soft rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">UPI / Parcel No.</span>
              <b className="text-base text-brand-ink">{listing.upiNumber || listing.upi_number || '-'}</b>
            </div>
            <div className="bg-brand-bg-soft rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">Type</span>
              <b className="text-base text-brand-ink capitalize">{listing.type}</b>
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
          <div className="sticky top-24 bg-white border-[1.5px] border-brand-line rounded-card p-6 shadow-md">
            <div className="text-3xl font-bold text-brand-green-dark mb-6">
              {Number(listing.priceRwf || listing.price_rwf || 0).toLocaleString('en-US')} RWF
            </div>

            {/* ── Blocker contact panel ── */}
            {renderContactPanel({
              kind: 'blocker',
              contactsLoading,
              revealedPhone: revealedContacts?.blockerPhone,
              revealedName: null,
              hasInfo: true, // blocker contact always exists
              user,
              listing,
              settings,
              openMoMo,
              title,
              copiedType,
              handleCopyContact,
            })}

            {/* ── Owner contact panel ── */}
            {hasOwnerInfo
              ? renderContactPanel({
                  kind: 'owner',
                  contactsLoading,
                  revealedPhone: revealedContacts?.ownerPhone,
                  revealedName: revealedContacts?.ownerName,
                  hasInfo: true,
                  user,
                  listing,
                  settings,
                  openMoMo,
                  title,
                  copiedType,
                  handleCopyContact,
                })
              : (
                <div className="mb-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold text-gray-400 mb-1">Owner contact</p>
                  <p className="text-sm text-gray-400">Not provided for this listing</p>
                </div>
              )}

            <div className="text-xs text-brand-ink-soft bg-brand-bg-soft p-3 rounded-lg border border-brand-line leading-relaxed">
              Instant unlock via MTN Mobile Money. Verified direct contact revealed after payment confirmation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to render a contact panel — keeps JSX DRY
function renderContactPanel({
  kind,
  contactsLoading,
  revealedPhone,
  revealedName,
  hasInfo,
  user,
  listing,
  settings,
  openMoMo,
  title,
  copiedType,
  handleCopyContact,
}) {
  const label = kind === 'blocker' ? 'BLOCKER' : 'OWNER';

  if (contactsLoading) {
    return (
      <div
        key={kind}
        className="mb-4 bg-brand-bg-soft border border-brand-line rounded-xl p-4 flex items-center justify-center gap-2 text-sm text-brand-ink-soft"
      >
        <Loader2 className="w-4 h-4 animate-spin text-brand-green" />
        <span>Checking unlock status...</span>
      </div>
    );
  }

  // Already unlocked — show the contact
  if (revealedPhone) {
    return (
      <div key={kind} className="mb-4 bg-[#E4F1EC] border border-[#007A66]/30 rounded-xl p-4">
        <p className="text-xs font-semibold text-brand-green-dark mb-2 flex items-center gap-1">
          <Unlock className="w-3.5 h-3.5" />
          {kind === 'blocker' ? 'Agent contact (unlocked)' : 'Owner contact (unlocked)'}
        </p>
        {revealedName && <p className="font-bold text-brand-ink mb-1">{revealedName}</p>}
        <p className="text-xl font-bold text-brand-green-dark">{revealedPhone}</p>
        <button
          onClick={() => handleCopyContact(revealedPhone, label)}
          className="mt-2 text-xs text-brand-green font-semibold hover:underline flex items-center gap-1"
        >
          {copiedType === label ? 'Copied!' : 'Copy number'}
        </button>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div
        key={kind}
        className="mb-4 bg-brand-bg-soft border border-brand-line rounded-xl p-4 text-center"
      >
        <p className="text-sm text-brand-ink-soft mb-2">
          {kind === 'blocker' ? 'Agent contact' : 'Owner contact'}
        </p>
        <Link to="/login" className="text-sm font-semibold text-brand-green hover:underline">
          Log in to unlock
        </Link>
      </div>
    );
  }

  // Locked — show unlock button
  const amount = kind === 'blocker' ? settings.blockerUnlockFee : settings.ownerUnlockFee;
  return (
    <div key={kind} className="mb-4 bg-brand-bg-soft border border-brand-line rounded-xl p-4">
      <h4 className="font-bold text-sm text-brand-ink flex items-center gap-2 mb-1">
        <Lock className="w-4 h-4 text-brand-green" />
        {kind === 'blocker' ? 'Blocker (agent) contact' : 'Owner contact'}
      </h4>
      <p className="text-xs text-brand-ink-soft mb-3">
        {kind === 'blocker'
          ? 'Talk to the verified local agent managing this property.'
          : 'Deal directly with the property owner.'}
      </p>
      <button
        onClick={() =>
          openMoMo({
            kind,
            listingId: listing.id,
            amount,
            title,
          })
        }
        className={`w-full py-2.5 text-white font-semibold rounded-xl text-sm ${
          kind === 'blocker'
            ? 'bg-brand-green hover:bg-brand-green-dark'
            : 'bg-brand-earth hover:bg-amber-800'
        }`}
      >
        Unlock for {amount} RWF
      </button>
    </div>
  );
}
