import React, { useState } from "react";
import { Button } from "../ui/button";
import { listingTitle } from "../../utils/listing";
import { FileCheck, Check, X } from "lucide-react";
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
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onApprove(l.id)}
                            className="rounded-[9px]"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onRevise(l.id)}
                            className="rounded-[9px]"
                          >
                            Revise
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReject(l.id)}
                            className="rounded-[9px] hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                          >
                            <X className="w-3 h-3" /> Reject
                          </Button>
                        </div>
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