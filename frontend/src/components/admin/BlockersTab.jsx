import React, { useState } from "react";
import {
  Users,
  Check,
  X,
  Pencil,
  Eye,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
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

export const BlockersTab = ({
  blockers,
  loading,
  onRefresh,
  onApprove,
  onReject,
  onRevise,
  onDelete,
}) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBlocker, setSelectedBlocker] = useState(null);

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
    <>
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
                  <th className="py-3 px-4">Operating Area</th>
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
                  const isApproved = app.status === "APPROVED";
                  const isRejected = app.status === "REJECTED";
                  const areaDisplay =
                    app.operating_location_path || app.operating_location_name || "-";
                  const rowActions = [
                    { label: "View details", icon: Eye, onClick: () => setSelectedBlocker(app) },
                  ];
                  if (isPending) {
                    rowActions.push(
                      { label: "Approve", icon: Check, onClick: () => onApprove(app.id) },
                      { label: "Request revision", icon: Pencil, onClick: () => onRevise(app.id) },
                      { label: "Reject", icon: X, destructive: true, onClick: () => onReject(app.id) }
                    );
                  }
                  if (isApproved) {
                    rowActions.push({
                      label: "Remove from public (Revoke)",
                      icon: Ban,
                      destructive: true,
                      onClick: () => onReject(app.id),
                    });
                  }
                  if (isRejected) {
                    rowActions.push({
                      label: "Re-approve blocker",
                      icon: Check,
                      onClick: () => onApprove(app.id),
                    });
                  }
                  if (onDelete) {
                    rowActions.push({
                      label: "Delete permanently",
                      icon: Trash2,
                      destructive: true,
                      onClick: () => onDelete(app.id),
                    });
                  }
                  return (
                    <tr key={app.id} className={rowClass}>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedBlocker(app)}
                          className="font-semibold text-brand-ink hover:text-brand-green hover:underline text-left cursor-pointer"
                        >
                          {fullName}
                        </button>
                        <div className="text-xs text-brand-ink-soft">
                          {app.phone} {app.email || app.contact_email ? `· ${app.email || app.contact_email}` : ""}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{app.national_id || "-"}</td>
                      <td className="py-3 px-4 text-xs">{areaDisplay}</td>
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
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBlocker(app)}
                            className="h-8 px-2.5 rounded-[7px] text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Button>
                          <RowActions
                            label={`Actions for ${fullName}`}
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
          <EmptyState>No blockers with status "{statusFilter}" found.</EmptyState>
        )}
      </Panel>

      {/* Blocker Application Details Modal */}
      {selectedBlocker && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedBlocker(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-brand-line overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-brand-line flex items-center justify-between bg-brand-bg-soft/50">
              <div>
                <h3 className="text-lg font-bold text-brand-ink">Blocker Application Details</h3>
                <p className="text-xs text-brand-ink-soft">
                  Submitted on {formatDate(selectedBlocker.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedBlocker.status} />
                <button
                  type="button"
                  onClick={() => setSelectedBlocker(null)}
                  className="p-1.5 rounded-full hover:bg-gray-200/60 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-4 rounded-xl bg-brand-bg-soft/60 border border-brand-line space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-ink-soft">
                  Applicant Information
                </div>
                <div className="text-lg font-bold text-brand-ink">
                  {`${selectedBlocker.first_name || ""} ${selectedBlocker.last_name || ""}`.trim() || "Unnamed"}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-brand-ink-soft pt-1">
                  {selectedBlocker.phone && (
                    <a
                      href={`tel:${selectedBlocker.phone}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-brand-green-dark hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {selectedBlocker.phone}
                    </a>
                  )}
                  {(selectedBlocker.email || selectedBlocker.contact_email) && (
                    <a
                      href={`mailto:${selectedBlocker.email || selectedBlocker.contact_email}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-brand-ink hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5 text-brand-green" />
                      {selectedBlocker.email || selectedBlocker.contact_email}
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-brand-line bg-white">
                  <div className="text-xs text-brand-ink-soft flex items-center gap-1.5 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-brand-green" />
                    <span>National ID (16 Digits)</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-brand-ink break-all">
                    {selectedBlocker.national_id || " "}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-brand-line bg-white">
                  <div className="text-xs text-brand-ink-soft flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-green" />
                    <span>Operating Area</span>
                  </div>
                  <div className="text-sm font-bold text-brand-ink">
                    {selectedBlocker.operating_location_path ||
                      selectedBlocker.operating_location_name ||
                      "Not specified"}
                  </div>
                </div>
              </div>

              {selectedBlocker.verification_code && (
                <div className="p-3.5 rounded-xl border border-brand-green/30 bg-brand-pale/40 flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-ink">Issued Blocker Code</span>
                  <span className="font-mono text-base font-extrabold text-brand-green-dark tracking-wider">
                    {selectedBlocker.verification_code}
                  </span>
                </div>
              )}

              {selectedBlocker.agreement_document_path && (
                <div className="p-3.5 rounded-xl border border-brand-line bg-white flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-ink flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-green" />
                    Signed Agreement Document
                  </span>
                  <span className="text-xs font-mono text-brand-green-dark">
                    {selectedBlocker.agreement_document_path}
                  </span>
                </div>
              )}

              {(selectedBlocker.rejection_reason || selectedBlocker.admin_note) && (
                <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800 space-y-1">
                  <div className="font-bold uppercase tracking-wider">Admin / Rejection Note</div>
                  <p>{selectedBlocker.rejection_reason || selectedBlocker.admin_note}</p>
                </div>
              )}

              <div className="text-xs text-brand-ink-soft flex items-center justify-between pt-1">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Submitted: {formatDate(selectedBlocker.created_at)}
                </span>
                {selectedBlocker.reviewed_at && (
                  <span>Reviewed: {formatDate(selectedBlocker.reviewed_at)}</span>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-brand-line bg-brand-bg-soft/40 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedBlocker(null)}
                  className="rounded-[9px]"
                >
                  Close
                </Button>
                {onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const id = selectedBlocker.id;
                      setSelectedBlocker(null);
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
                {selectedBlocker.status === "PENDING" && (
                  <>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        const id = selectedBlocker.id;
                        setSelectedBlocker(null);
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
                        const id = selectedBlocker.id;
                        setSelectedBlocker(null);
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
                        const id = selectedBlocker.id;
                        setSelectedBlocker(null);
                        onApprove(id);
                      }}
                      className="rounded-[9px]"
                    >
                      <Check className="w-4 h-4" />
                      Approve Blocker
                    </Button>
                  </>
                )}

                {selectedBlocker.status === "APPROVED" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const id = selectedBlocker.id;
                      setSelectedBlocker(null);
                      onReject(id);
                    }}
                    className="rounded-[9px] border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Ban className="w-4 h-4" />
                    Remove from Public (Revoke)
                  </Button>
                )}

                {selectedBlocker.status === "REJECTED" && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      const id = selectedBlocker.id;
                      setSelectedBlocker(null);
                      onApprove(id);
                    }}
                    className="rounded-[9px]"
                  >
                    <Check className="w-4 h-4" />
                    Re-Approve Blocker
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