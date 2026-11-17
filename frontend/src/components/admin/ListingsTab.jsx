import React, { useState } from "react";
import { listingTitle, listingSize, mediaUrl } from "../../utils/listing";
import {
  FileCheck,
  Check,
  X,
  Pencil,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Star,
  User,
  Calendar,
  Trash2,
  Ban,
} from "lucide-react";
import { Button } from "../ui/button";
import { RowActions } from "./RowActions";
import {
  Panel,
  RefreshButton,
  StatusBadge,
  StatusFilter,
  LoadingState,
  EmptyState,
  formatDate,
  tableClass,
  theadClass,
  tbodyClass,
  rowClass,
} from "./AdminShared";

export const ListingsTab = ({
  listings,
  loading,
  onRefresh,
  onApprove,
  onReject,
  onRevise,
  onToggleDisabled,
  onDelete,
}) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedListing, setSelectedListing] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const count = (s) => listings.filter((l) => l.status === s).length;
  const counts = {
    ALL: listings.length,
    PENDING: count("PENDING"),
    APPROVED: count("APPROVED"),
    REJECTED: count("REJECTED"),
    NEEDS_REVISION: count("NEEDS_REVISION"),
  };

  const visible =
    statusFilter === "ALL"
      ? listings
      : listings.filter((l) => l.status === statusFilter);

  const openDetail = (l) => {
    setSelectedListing(l);
    setActivePhotoIdx(0);
  };

  const getPhotosForListing = (l) => {
    if (!l) return [];
    const list = [];
    if (Array.isArray(l.photos)) {
      l.photos.forEach((p) => {
        const u = mediaUrl(typeof p === "string" ? p : p.file_path || p.filePath);
        if (u && !list.includes(u)) list.push(u);
      });
    }
    const cover = mediaUrl(l.cover_photo_path || l.coverPhotoPath);
    if (cover && !list.includes(cover)) {
      list.unshift(cover);
    }
    return list;
  };

  const modalPhotos = getPhotosForListing(selectedListing);
  const loc = selectedListing?.location || {};
  const locationPath = [loc.province, loc.district, loc.sector, loc.cell, loc.village]
    .filter(Boolean)
    .join(" → ");

  return (
    <>
      <Panel
        icon={FileCheck}
        title={`All Listings (${listings.length})`}
        actions={<RefreshButton onClick={onRefresh} loading={loading} />}
      >
        <StatusFilter counts={counts} active={statusFilter} onChange={setStatusFilter} />

        {loading ? (
          <LoadingState />
        ) : visible.length > 0 ? (
          <div className="overflow-x-auto">
            <table className={`${tableClass} min-w-[860px]`}>
              <thead className={theadClass}>
                <tr>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Blocker</th>
                  <th className="py-3 px-4">Owner contact</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={tbodyClass}>
                {visible.map((l) => {
                  const title = l.title || listingTitle(l) || "Untitled";
                  const isPending = l.status === "PENDING";
                  const isApproved = l.status === "APPROVED";
                  const isRejected = l.status === "REJECTED";
                  const blocker =
                    `${l.blocker_first_name || ""} ${l.blocker_last_name || ""}`.trim() ||
                    l.blocker_phone ||
                    "-";
                  const ownerPhone = l.owner_phone || l.ownerPhone;
                  const ownerName = l.owner_name || l.ownerName;
                  const rowActions = [
                    { label: "View details", icon: Eye, onClick: () => openDetail(l) },
                  ];
                  if (isPending) {
                    rowActions.push(
                      { label: "Approve", icon: Check, onClick: () => onApprove(l.id) },
                      { label: "Request revision", icon: Pencil, onClick: () => onRevise(l.id) },
                      { label: "Reject", icon: X, destructive: true, onClick: () => onReject(l.id) }
                    );
                  }
                  if (isApproved) {
                    if (onToggleDisabled) {
                      rowActions.push({
                        label: l.is_disabled ? "Restore to public" : "Hide from public",
                        icon: l.is_disabled ? Eye : EyeOff,
                        onClick: () => onToggleDisabled(l.id),
                      });
                    }
                    rowActions.push({
                      label: "Unpublish (Revoke approval)",
                      icon: Ban,
                      destructive: true,
                      onClick: () => onReject(l.id),
                    });
                  }
                  if (isRejected) {
                    rowActions.push({
                      label: "Approve (Make public)",
                      icon: Check,
                      onClick: () => onApprove(l.id),
                    });
                  }
                  if (onDelete) {
                    rowActions.push({
                      label: "Delete permanently",
                      icon: Trash2,
                      destructive: true,
                      onClick: () => onDelete(l.id),
                    });
                  }
                  return (
                    <tr key={l.id} className={rowClass}>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => openDetail(l)}
                          className="font-semibold text-brand-ink hover:text-brand-green hover:underline text-left cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{title}</span>
                          {l.is_vip && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              <Star className="w-2.5 h-2.5 fill-amber-600" /> VIP
                            </span>
                          )}
                        </button>
                        <div className="text-xs font-semibold text-brand-green-dark">
                          {Number(l.price_rwf || 0).toLocaleString()} RWF
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {blocker}
                        <br />
                        <span className="text-brand-ink-soft">{l.blocker_phone}</span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {ownerName && <div className="font-medium">{ownerName}</div>}
                        {ownerPhone ? (
                          <span className="font-mono text-brand-green-dark">{ownerPhone}</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Blocker contact only</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-brand-ink-soft">
                        {formatDate(l.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={l.status} />
                          {l.is_disabled && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                              Hidden
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openDetail(l)}
                            className="h-8 px-2.5 rounded-[7px] text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Button>
                          <RowActions
                            label={`Actions for ${title}`}
                            actions={rowActions}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No listings with status "{statusFilter}" found.</EmptyState>
        )}
      </Panel>

      {/* Listing Details Review Modal */}
      {selectedListing && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedListing(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-brand-line overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-brand-line flex items-center justify-between bg-brand-bg-soft/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-brand-ink">
                    {selectedListing.title || listingTitle(selectedListing) || "Property Review"}
                  </h3>
                  {selectedListing.is_vip && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      <Star className="w-3 h-3 fill-amber-600" /> VIP Exclusive
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-ink-soft">
                  Submitted on {formatDate(selectedListing.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedListing.status} />
                <button
                  type="button"
                  onClick={() => setSelectedListing(null)}
                  className="p-1.5 rounded-full hover:bg-gray-200/60 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Photo gallery */}
              {modalPhotos.length > 0 ? (
                <div className="space-y-2">
                  <div className="w-full h-64 rounded-xl overflow-hidden border border-brand-line bg-brand-bg-soft">
                    <img
                      src={modalPhotos[activePhotoIdx] || modalPhotos[0]}
                      alt="Property preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {modalPhotos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {modalPhotos.map((url, idx) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setActivePhotoIdx(idx)}
                          className={`w-16 h-14 rounded-lg overflow-hidden border-2 shrink-0 ${
                            activePhotoIdx === idx ? "border-brand-green" : "border-transparent opacity-70"
                          }`}
                        >
                          <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-brand-line text-center text-xs text-brand-ink-soft bg-brand-bg-soft/30">
                  No photos uploaded for this listing.
                </div>
              )}

              {/* Key specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-brand-bg-soft/60 border border-brand-line">
                  <span className="text-[11px] text-brand-ink-soft block">Price</span>
                  <span className="text-sm font-extrabold text-brand-green-dark">
                    {Number(selectedListing.price_rwf || 0).toLocaleString()} RWF
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-brand-bg-soft/60 border border-brand-line">
                  <span className="text-[11px] text-brand-ink-soft block">Type</span>
                  <span className="text-sm font-bold text-brand-ink capitalize">
                    {(selectedListing.type || "Plot").toLowerCase()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-brand-bg-soft/60 border border-brand-line">
                  <span className="text-[11px] text-brand-ink-soft block">Size</span>
                  <span className="text-sm font-bold text-brand-ink">
                    {listingSize(selectedListing) || " "}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-brand-bg-soft/60 border border-brand-line">
                  <span className="text-[11px] text-brand-ink-soft block">UPI / Parcel No.</span>
                  <span className="text-xs font-mono font-bold text-brand-ink break-all">
                    {selectedListing.upi_number || " "}
                  </span>
                </div>
              </div>

              {/* Location Hierarchy */}
              <div className="p-3.5 rounded-xl border border-brand-line bg-white">
                <div className="text-xs text-brand-ink-soft flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-green" />
                  <span>Location (Province → District → Sector → Cell → Village)</span>
                </div>
                <div className="text-sm font-semibold text-brand-ink">
                  {locationPath || "Location details not available"}
                </div>
              </div>

              {/* Titles & Descriptions (All languages) */}
              <div className="p-4 rounded-xl border border-brand-line bg-white space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-ink-soft">
                  Titles &amp; Descriptions
                </div>
                <div className="space-y-2 text-xs">
                  {selectedListing.title_en && (
                    <div>
                      <span className="font-bold text-brand-ink">[EN] {selectedListing.title_en}</span>
                      {selectedListing.description_en && (
                        <p className="text-brand-ink-soft mt-0.5 leading-relaxed">
                          {selectedListing.description_en}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedListing.title_rw && (
                    <div>
                      <span className="font-bold text-brand-ink">[RW] {selectedListing.title_rw}</span>
                      {selectedListing.description_rw && (
                        <p className="text-brand-ink-soft mt-0.5 leading-relaxed">
                          {selectedListing.description_rw}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedListing.title_fr && (
                    <div>
                      <span className="font-bold text-brand-ink">[FR] {selectedListing.title_fr}</span>
                      {selectedListing.description_fr && (
                        <p className="text-brand-ink-soft mt-0.5 leading-relaxed">
                          {selectedListing.description_fr}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* VIP Details if applicable */}
              {selectedListing.is_vip && (
                <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 space-y-1 text-xs">
                  <div className="font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-600" />
                    VIP Room Exclusive Details
                  </div>
                  <div className="flex flex-wrap gap-4 text-amber-900 pt-1">
                    {selectedListing.vip_was_price_rwf && (
                      <span>
                        Original Market Value:{" "}
                        <b>{Number(selectedListing.vip_was_price_rwf).toLocaleString()} RWF</b>
                      </span>
                    )}
                    {selectedListing.vip_discount_percent && (
                      <span>
                        Discount: <b>{selectedListing.vip_discount_percent}% OFF</b>
                      </span>
                    )}
                    {selectedListing.vip_reason && (
                      <span>
                        Reason: <b>{selectedListing.vip_reason}</b>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Owner Contact & Submitting Blocker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-brand-line bg-brand-bg-soft/40 space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-ink-soft flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-green" />
                    Property Owner Contact
                  </div>
                  <div className="text-sm font-bold text-brand-ink">
                    {selectedListing.owner_name || "Not provided"}
                  </div>
                  <div className="text-xs font-mono text-brand-green-dark">
                    {selectedListing.owner_phone || "No direct owner phone (Blocker only)"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-brand-line bg-brand-bg-soft/40 space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-ink-soft flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-green" />
                    Submitted by Blocker
                  </div>
                  <div className="text-sm font-bold text-brand-ink">
                    {`${selectedListing.blocker_first_name || ""} ${selectedListing.blocker_last_name || ""}`.trim() ||
                      "Blocker"}
                    {selectedListing.blocker_verification_code && (
                      <span className="ml-1.5 font-mono text-xs text-brand-green-dark">
                        ({selectedListing.blocker_verification_code})
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-brand-ink-soft">
                    {selectedListing.blocker_phone || ""}
                  </div>
                </div>
              </div>

              {(selectedListing.rejection_reason || selectedListing.admin_note) && (
                <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800 space-y-1">
                  <div className="font-bold uppercase tracking-wider">Admin / Rejection Note</div>
                  <p>{selectedListing.rejection_reason || selectedListing.admin_note}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-brand-line bg-brand-bg-soft/40 flex flex-wrap items-center justify-between gap-2">
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
                {selectedListing.status === "PENDING" && (
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
                      variant="outline"
                      onClick={() => {
                        const id = selectedListing.id;
                        setSelectedListing(null);
                        onRevise(id);
                      }}
                      className="rounded-[9px]"
                    >
                      <Pencil className="w-4 h-4" />
                      Request Revision
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

                {selectedListing.status === "APPROVED" && (
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
                        {selectedListing.is_disabled ? (
                          <>
                            <Eye className="w-4 h-4" />
                            Restore to Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Hide from Public
                          </>
                        )}
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
                      Unpublish (Revoke)
                    </Button>
                  </>
                )}

                {selectedListing.status === "REJECTED" && (
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
                    Approve (Make Public)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};