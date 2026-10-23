import React, { useState } from "react";
import { Button } from "../ui/button";
import { Users, Check, X } from "lucide-react";
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

export const BlockersTab = ({
  blockers,
  loading,
  onRefresh,
  onApprove,
  onReject,
  onRevise,
}) => {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const count = (s) => blockers.filter((b) => b.status === s).length;
  const counts = {
    ALL: blockers.length,
    PENDING: count("PENDING"),
    APPROVED: count("APPROVED"),
    REJECTED: count("REJECTED"),
    NEEDS_REVISION: count("NEEDS_REVISION"),
  };

  const visible =
    statusFilter === "ALL"
      ? blockers
      : blockers.filter((b) => b.status === statusFilter);

  return (
    <Panel
      icon={Users}
      title={`All Blockers (${blockers.length})`}
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
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">National ID</th>
                <th className="py-3 px-4">Area</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {visible.map((app) => {
                const fullName =
                  `${app.first_name || ""} ${app.last_name || ""}`.trim() || "Unnamed";
                const isPending = app.status === "PENDING";
                return (
                  <tr key={app.id} className={rowClass}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-brand-ink">{fullName}</div>
                      <div className="text-xs text-brand-ink-soft">
                        {app.phone} {app.contact_email ? `· ${app.contact_email}` : ""}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{app.national_id || "-"}</td>
                    <td className="py-3 px-4 text-xs">{app.operating_location_name || "-"}</td>
                    <td className="py-3 px-4 text-xs text-brand-ink-soft">
                      {formatDate(app.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-brand-green-dark">
                      {app.verification_code || "-"}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isPending && (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onApprove(app.id)}
                            className="rounded-[9px]"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onRevise(app.id)}
                            className="rounded-[9px]"
                          >
                            Revise
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReject(app.id)}
                            className="rounded-[9px] hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                          >
                            <X className="w-3 h-3" /> Reject
                          </Button>
                        </div>
                      )}
                      {!isPending && app.admin_note && (
                        <span className="text-xs text-gray-400 italic" title={app.admin_note}>
                          Note: {app.admin_note.substring(0, 30)}…
                        </span>
                      )}
                      {!isPending && app.rejection_reason && (
                        <span
                          className="text-xs text-red-400 italic"
                          title={app.rejection_reason}
                        >
                          Rejected
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
        <EmptyState>No blockers with status "{statusFilter}" found.</EmptyState>
      )}
    </Panel>
  );
};