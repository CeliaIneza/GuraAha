import React, { useState } from "react";
import { Users, Check, X, Pencil } from "lucide-react";
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
                        <RowActions
                          label={`Actions for ${fullName}`}
                          actions={[
                            { label: "Approve", icon: Check, onClick: () => onApprove(app.id) },
                            { label: "Request revision", icon: Pencil, onClick: () => onRevise(app.id) },
                            { label: "Reject", icon: X, destructive: true, onClick: () => onReject(app.id) },
                          ]}
                        />
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