import React, { useState } from "react";
import { listingTitle } from "../../utils/listing";
import { FileCheck, Check, X, Pencil } from "lucide-react";
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
}) => {
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  return (
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
                const blocker =
                  `${l.blocker_first_name || ""} ${l.blocker_last_name || ""}`.trim() ||
                  l.blocker_phone ||
                  "-";
                const ownerPhone = l.owner_phone || l.ownerPhone;
                const ownerName = l.owner_name || l.ownerName;
                const note = l.admin_note || l.rejection_reason;
                return (
                  <tr key={l.id} className={rowClass}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-brand-ink">{title}</div>
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
                        <span className="text-red-500 font-semibold">⚠ No phone</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-brand-ink-soft">
                      {formatDate(l.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isPending && (
                        <RowActions
                          label={`Actions for ${title}`}
                          actions={[
                            { label: "Approve", icon: Check, onClick: () => onApprove(l.id) },
                            { label: "Request revision", icon: Pencil, onClick: () => onRevise(l.id) },
                            { label: "Reject", icon: X, destructive: true, onClick: () => onReject(l.id) },
                          ]}
                        />
                      )}
                      {!isPending && note && (
                        <span
                          className="text-xs text-gray-400 italic max-w-[120px] truncate inline-block"
                          title={note}
                        >
                          {note.substring(0, 25)}…
                        </span>
                      )}
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
  );
};