import React, { useState } from 'react';
import {
  blockerLabel,
  isFeaturedListing,
  isRentListing,
  listingCategory,
  listingCoverUrl,
  listingDescription,
  listingGalleryUrls,
  listingPrice,
  listingSize,
  listingSubType,
  listingTerms,
  listingTitle,
  mediaUrl,
} from '../../utils/listing';
import { useApp } from '../../context/AppContext';
import {
  FileCheck,
  Check,
  X,
  Pencil,
  Eye,
  EyeOff,
  Phone,
  Star,
  Trash2,
  Ban,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/button';
import { RowActions } from './RowActions';
import {
  Panel,
  RefreshButton,
  StatusBadge,
  StatusFilter,
  LoadingState,
  EmptyState,
  tableClass,
  theadClass,
  tbodyClass,
  rowClass,
} from './AdminShared';

export const ListingsTab = ({
  listings,
  loading,
  onRefresh,
  onApprove,
  onReject,
  onRevise,
  onToggleDisabled,
  onToggleFeatured,
  onDelete,
}) => {
  const { getDistrictHighlight } = useApp();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dealFilter, setDealFilter] = useState('ALL');
  const [selectedListing, setSelectedListing] = useState(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState('');

  const count = (s) => listings.filter((l) => l.status === s).length;
  const counts = {
    ALL: listings.length,
    PENDING: count('PENDING'),
    APPROVED: count('APPROVED'),
    REJECTED: count('REJECTED'),
    NEEDS_REVISION: count('NEEDS_REVISION'),
  };

  const visible = listings.filter((l) => {
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    if (dealFilter !== 'ALL') {
      const d = (l.deal || 'sale').toLowerCase();
      if (d !== dealFilter.toLowerCase()) return false;
    }
    return true;
  });

  const getPhotosForListing = (l) => {
    if (!l) return [];
    const list = [];
    if (Array.isArray(l.photos)) {
      l.photos.forEach((p) => {
        const u = mediaUrl(typeof p === 'string' ? p : p.file_path || p.filePath);
        if (u && !list.includes(u)) list.push(u);
      });
    }
    const cover = mediaUrl(l.cover_photo_path || l.coverPhotoPath);
    if (cover && !list.includes(cover)) {
      list.unshift(cover);
    }
    if (list.length > 0) return list;
    return listingGalleryUrls(l);
  };

  const openDetail = (l) => {
    const urls = getPhotosForListing(l);
    setSelectedListing(l);
    setActivePhotoUrl(urls[0] || listingCoverUrl(l, 1200) || '');
  };

  const modalPhotos = getPhotosForListing(selectedListing);
  const loc = selectedListing?.location || {};
  const districtName = loc.district || selectedListing?.dist || 'Kicukiro';
  const crumbs = [
    'Rwanda',
    loc.province || selectedListing?.prov || 'Kigali City',
    districtName,
    loc.sector || selectedListing?.sect,
    loc.cell || selectedListing?.cell,
    loc.village || selectedListing?.vill,
  ].filter(Boolean);

  return (
    <>
      <Panel
        icon={FileCheck}
        title={`All Listings (${listings.length})`}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={dealFilter}
              onChange={(e) => setDealFilter(e.target.value)}
              className="h-9 px-3 rounded-[9px] border border-brand-line bg-white text-xs font-semibold text-brand-ink"
            >
              <option value="ALL">All (Sale &amp; Rent)</option>
              <option value="sale">🏷️ For sale</option>
              <option value="rent">🔑 For rent</option>
            </select>
            <RefreshButton onClick={onRefresh} loading={loading} />
          </div>
        }
      >
        <StatusFilter counts={counts} active={statusFilter} onChange={setStatusFilter} />

        {loading ? (
          <LoadingState />
        ) : visible.length > 0 ? (
          <div className="overflow-x-auto">
            {/* Exact columns: # | Property | Blocker | Type | Price (RWF) | Status | Actions */}
            <table className={`${tableClass} min-w-[880px]`}>
              <thead className={theadClass}>
                <tr>
                  <th className="py-3 px-3.5">#</th>
                  <th className="py-3 px-3.5">Property</th>
                  <th className="py-3 px-3.5">Blocker</th>
                  <th className="py-3 px-3.5">Type</th>
                  <th className="py-3 px-3.5">Price (RWF)</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={tbodyClass}>
                {visible.map((l, idx) => {
                  const title = l.title || listingTitle(l) || 'Untitled';
                  const isPending = l.status === 'PENDING';
                  const isApproved = l.status === 'APPROVED';
                  const isRejected = l.status === 'REJECTED';
                  const isFeatured = isFeaturedListing(l);
                  const isRent = isRentListing(l);
                  const blocker =
                    `${l.blocker_first_name || ''} ${l.blocker_last_name || ''}`.trim() ||
                    l.blocker_phone ||
                    '—';
                  const code = l.blocker_verification_code;
                  const cat = listingCategory(l);
                  const sub = listingSubType(l);
                  const typeDisplay =
                    cat && sub && cat.toLowerCase() !== sub.toLowerCase()
                      ? `${cat} · ${sub}`
                      : cat || sub || l.type || 'Property';

                  const rowActions = [
                    { label: 'View details', icon: Eye, onClick: () => openDetail(l) },
                  ];
                  if (onToggleFeatured) {
                    rowActions.push({
                      label: isFeatured ? 'Unfeature from Homepage' : '★ Feature on Homepage',
                      icon: Star,
                      onClick: () => onToggleFeatured(l.id),
                    });
                  }
                  if (isPending) {
                    rowActions.push(
                      { label: 'Approve', icon: Check, onClick: () => onApprove(l.id) },
                      { label: 'Request revision', icon: Pencil, onClick: () => onRevise(l.id) },
                      { label: 'Reject', icon: X, destructive: true, onClick: () => onReject(l.id) }
                    );
                  }
                  if (isApproved) {
                    if (onToggleDisabled) {
                      rowActions.push({
                        label: l.is_disabled ? 'Restore to public' : 'Hide from public',
                        icon: l.is_disabled ? Eye : EyeOff,
                        onClick: () => onToggleDisabled(l.id),
                      });
                    }
                    rowActions.push({
                      label: 'Unpublish (Revoke approval)',
                      icon: Ban,
                      destructive: true,
                      onClick: () => onReject(l.id),
                    });
                  }
                  if (isRejected) {
                    rowActions.push({
                      label: 'Approve (Make public)',
                      icon: Check,
                      onClick: () => onApprove(l.id),
                    });
                  }
                  if (onDelete) {
                    rowActions.push({
                      label: 'Delete permanently',
                      icon: Trash2,
                      destructive: true,
                      onClick: () => onDelete(l.id),
                    });
                  }
                  return (
                    <tr key={l.id} className={rowClass}>
                      <td className="py-3 px-3.5 font-mono text-xs text-brand-ink-soft">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3.5">
                        <button
                          type="button"
                          onClick={() => openDetail(l)}
                          className="font-semibold text-brand-ink hover:text-brand-green hover:underline text-left cursor-pointer flex items-center gap-1.5 flex-wrap"
                        >
                          <span>{title}</span>
                          {isFeatured && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              ★ Featured
                            </span>
                          )}
                          {l.is_vip && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                              ⭐ VIP
                            </span>
                          )}
                        </button>
                        <div className="text-[11px] text-brand-ink-soft mt-0.5">
                          {[l.location?.sector, l.location?.district].filter(Boolean).join(', ')}
                          {l.upi_number ? ` · UPI ${l.upi_number}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-xs">
                        <div className="font-semibold text-brand-ink">{blocker}</div>
                        {code && (
                          <span className="font-mono text-[11px] text-brand-green-dark">
                            {code}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-xs whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold whitespace-nowrap ${
                            isRent
                              ? 'bg-[#E5ECF6] text-[#1D3559]'
                              : 'bg-[#E0F2EE] text-[#00594A]'
                          }`}
                        >
                          {isRent ? 'For rent' : 'For sale'}
                        </span>
                        <div className="text-brand-ink-soft mt-1 font-medium whitespace-nowrap">
                          {typeDisplay}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-xs font-bold text-brand-green-dark whitespace-nowrap">
                        {Number(l.price_rwf || 0).toLocaleString()} RWF
                        {isRent ? ' / mo' : ''}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={l.status} />
                          {l.is_disabled && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                              Disabled
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <RowActions
                          label={`Actions for ${title}`}
                          actions={rowActions}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No listings with status &quot;{statusFilter}&quot; found.</EmptyState>
        )}
      </Panel>

      {/* Full Property Detail Inspection Modal matching Screenshot #4 */}
      {selectedListing && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedListing(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-brand-line overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="px-6 py-3.5 border-b border-brand-line flex items-center justify-between bg-brand-bg-soft/60 shrink-0">
              <div className="text-xs text-brand-ink-soft flex items-center gap-1.5 flex-wrap">
                {crumbs.map((c, idx) => (
                  <span key={`${c}-${idx}`} className="flex items-center gap-1">
                    <span
                      className={
                        idx === crumbs.length - 1 ? 'font-bold text-brand-green-dark' : ''
                      }
                    >
                      {c}
                    </span>
                    {idx < crumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedListing.status} />
                <button
                  type="button"
                  onClick={() => setSelectedListing(null)}
                  className="p-1.5 rounded-full hover:bg-gray-200/70 text-gray-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body — 2-column layout identical to Screenshot #4 */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Left 3 cols: Main Photo + 4 Thumbnails + Title + VIP Banner + 6 Spec Cards + About + Area Highlights */}
                <div className="md:col-span-3">
                  <div
                    className="relative w-full h-72 sm:h-80 rounded-[16px] bg-cover bg-center shadow-sm overflow-hidden bg-brand-bg-soft"
                    style={{
                      backgroundImage: `url('${activePhotoUrl || modalPhotos[0] || ''}')`,
                    }}
                  >
                    <span
                      className={`absolute top-3.5 left-0 inline-flex items-center gap-1.5 pl-3.5 pr-4 py-1.5 rounded-r-full text-white text-xs font-extrabold uppercase tracking-wider shadow-md ${
                        isRentListing(selectedListing)
                          ? 'bg-[#2B4C7E]'
                          : 'bg-[#007A66]'
                      }`}
                    >
                      {isRentListing(selectedListing) ? 'FOR RENT' : 'FOR SALE'}
                    </span>
                  </div>

                  {/* Thumbnails row */}
                  {modalPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2.5 mt-3">
                      {modalPhotos.slice(0, 4).map((url) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setActivePhotoUrl(url)}
                          className={`h-20 rounded-xl bg-cover bg-center cursor-pointer transition-all ${
                            activePhotoUrl === url
                              ? 'ring-3 ring-brand-green ring-offset-1'
                              : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundImage: `url('${url}')` }}
                        />
                      ))}
                    </div>
                  )}

                  <h1 className="text-2xl font-extrabold text-brand-ink mt-5">
                    {selectedListing.title || listingTitle(selectedListing)}
                  </h1>

                  {/* Category + VIP badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="px-3 py-1 rounded-full bg-[#1C2A24] text-[#F3DFA2] text-xs font-bold">
                      {listingCategory(selectedListing)}
                    </span>
                    {selectedListing.is_vip && (
                      <span className="px-3 py-1 rounded-full bg-[#D3B42B] text-[#1C2A24] text-xs font-extrabold">
                        ⭐ VIP deal
                        {selectedListing.vip_was_price_rwf
                          ? ` · was ${Number(selectedListing.vip_was_price_rwf).toLocaleString()} RWF`
                          : ''}
                        {selectedListing.vip_early_access_days
                          ? ` · public in ${selectedListing.vip_early_access_days} days`
                          : ''}
                      </span>
                    )}
                  </div>

                  {selectedListing.vip_reason && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-brand-bg-soft border border-brand-line text-xs text-brand-ink">
                      <strong>Why it&apos;s discounted:</strong> {selectedListing.vip_reason}
                    </div>
                  )}

                  {/* 6 Spec Cards matching Screenshot #4 */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-brand-bg-soft/60 rounded-xl p-3 border border-brand-line">
                      <span className="text-xs text-brand-ink-soft block">Listing for</span>
                      <b className="text-sm text-brand-ink">
                        {isRentListing(selectedListing) ? 'Rent' : 'Sale'}
                      </b>
                    </div>
                    <div className="bg-brand-bg-soft/60 rounded-xl p-3 border border-brand-line">
                      <span className="text-xs text-brand-ink-soft block">Terms</span>
                      <b className="text-sm text-brand-ink">
                        {listingTerms(selectedListing)}
                      </b>
                    </div>
                    <div className="bg-brand-bg-soft/60 rounded-xl p-3 border border-brand-line">
                      <span className="text-xs text-brand-ink-soft block">Size</span>
                      <b className="text-sm text-brand-ink">
                        {listingSize(selectedListing) || '—'}
                      </b>
                    </div>
                    <div className="bg-brand-bg-soft/60 rounded-xl p-3 border border-brand-line">
                      <span className="text-xs text-brand-ink-soft block">UPI / Parcel No.</span>
                      <b className="text-sm text-brand-ink font-mono">
                        {selectedListing.upi_number || selectedListing.upi || '—'}
                      </b>
                    </div>
                    <div className="bg-brand-bg-soft/60 rounded-xl p-3 border border-brand-line">
                      <span className="text-xs text-brand-ink-soft block">Type</span>
                      <b className="text-sm text-brand-ink">
                        {listingSubType(selectedListing)}
                      </b>
                    </div>
                    <div className="bg-brand-bg-soft/60 rounded-xl p-3 border border-brand-line">
                      <span className="text-xs text-brand-ink-soft block">Verified blocker</span>
                      <b className="text-sm text-brand-ink">
                        {blockerLabel(selectedListing)}
                      </b>
                    </div>
                  </div>

                  {/* About this property */}
                  <div className="mt-6">
                    <h4 className="font-bold text-base text-brand-ink mb-1.5">
                      About this property
                    </h4>
                    <p className="text-sm text-brand-ink-soft leading-relaxed">
                      {listingDescription(selectedListing, 'en') || 'No description provided.'}
                    </p>
                  </div>

                  {/* Area investment highlights */}
                  <div className="mt-6">
                    <h4 className="font-bold text-base text-brand-ink mb-1.5">
                      📍 Area investment highlights
                    </h4>
                    <p className="text-xs sm:text-sm text-brand-ink-soft leading-relaxed">
                      {(getDistrictHighlight(districtName) || [])[0] ||
                        'Rapid growth corridor: new tarmac road, fibre coverage, 10 min to markets and schools. District development plan zones this cell for residential expansion.'}
                    </p>
                    <span className="inline-block mt-2 px-2.5 py-1 rounded-md bg-brand-bg-soft border border-brand-line text-[11px] font-semibold text-brand-ink-soft">
                      Editable per District/Sector by admin
                    </span>
                  </div>
                </div>

                {/* Right 2 cols: Price & Unlocked Blocker + Owner Contact Cards (Admin always sees full contacts) */}
                <div className="md:col-span-2">
                  <div className="bg-white border border-brand-line rounded-[16px] p-5 shadow-sm space-y-4">
                    <div className="text-2xl sm:text-3xl font-extrabold text-brand-green-dark">
                      {listingPrice(selectedListing).toLocaleString('en-US')} RWF
                      {isRentListing(selectedListing) && (
                        <span className="text-sm font-medium text-brand-ink-soft">
                          {' '}
                          / month
                        </span>
                      )}
                    </div>

                    {/* Blocker Contact Card */}
                    <div className="p-4 rounded-xl bg-[#E0F2EE]/70 border border-brand-green/40 space-y-1">
                      <div className="text-xs font-bold text-brand-ink">
                        🔓 Blocker (agent) contact
                      </div>
                      <div className="text-lg font-extrabold text-brand-ink font-mono">
                        {selectedListing.blocker_phone ||
                          selectedListing.blockerPhone ||
                          '+250 788 456 210'}
                      </div>
                      <div className="text-xs text-brand-ink-soft">
                        {`${selectedListing.blocker_first_name || ''} ${selectedListing.blocker_last_name || ''}`.trim() ||
                          blockerLabel(selectedListing)}{' '}
                        {selectedListing.blocker_verification_code
                          ? `· verified code ${selectedListing.blocker_verification_code}`
                          : ''}{' '}
                        ·{' '}
                        <a
                          href={`tel:${selectedListing.blocker_phone || '+250788456210'}`}
                          className="underline font-semibold text-brand-green-dark"
                        >
                          Call
                        </a>{' '}
                        ·{' '}
                        <a
                          href={`https://wa.me/${String(
                            selectedListing.blocker_phone || '250788456210'
                          ).replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-semibold text-brand-green-dark"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Owner Contact Card */}
                    <div className="p-4 rounded-xl bg-[#E0F2EE]/70 border border-brand-green/40 space-y-1">
                      <div className="text-xs font-bold text-brand-ink">
                        🔓 Owner contact
                      </div>
                      <div className="text-lg font-extrabold text-brand-ink font-mono">
                        {selectedListing.owner_phone ||
                          selectedListing.ownerPhone ||
                          'Not provided (Blocker only)'}
                      </div>
                      <div className="text-xs text-brand-ink-soft">
                        {selectedListing.owner_name || 'Owner'} · verified by Guraaha
                        {(selectedListing.owner_phone || selectedListing.ownerPhone) && (
                          <>
                            {' · '}
                            <a
                              href={`tel:${
                                selectedListing.owner_phone || selectedListing.ownerPhone
                              }`}
                              className="underline font-semibold text-brand-green-dark"
                            >
                              Call
                            </a>
                            {' · '}
                            <a
                              href={`https://wa.me/${String(
                                selectedListing.owner_phone || selectedListing.ownerPhone
                              ).replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="underline font-semibold text-brand-green-dark"
                            >
                              WhatsApp
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-brand-bg-soft border border-brand-line text-xs text-brand-ink-soft">
                      Admin Inspection View: All photos, UPI title details, and private owner/blocker contacts are unlocked for verification.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-3.5 border-t border-brand-line bg-brand-bg-soft/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedListing(null)}
                  className="rounded-[9px]"
                >
                  Close
                </Button>
                {onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const id = selectedListing.id;
                      setSelectedListing(null);
                      onDelete(id);
                    }}
                    className="rounded-[9px]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedListing.status === 'PENDING' && (
                  <>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        const id = selectedListing.id;
                        setSelectedListing(null);
                        onReject(id);
                      }}
                      className="rounded-[9px]"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => {
                        const id = selectedListing.id;
                        setSelectedListing(null);
                        onApprove(id);
                      }}
                      className="rounded-[9px]"
                    >
                      <Check className="w-4 h-4" />
                      Approve Listing
                    </Button>
                  </>
                )}

                {selectedListing.status === 'APPROVED' && (
                  <>
                    {onToggleDisabled && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const id = selectedListing.id;
                          setSelectedListing(null);
                          onToggleDisabled(id);
                        }}
                        className="rounded-[9px]"
                      >
                        {selectedListing.is_disabled ? 'Restore to Public' : 'Hide from Public'}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const id = selectedListing.id;
                        setSelectedListing(null);
                        onReject(id);
                      }}
                      className="rounded-[9px] border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Ban className="w-4 h-4" />
                      Unpublish
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};