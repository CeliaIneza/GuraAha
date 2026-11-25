import React, { useState } from 'react';
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
  formatDate,
  tableClass,
  theadClass,
  tbodyClass,
  rowClass,
} from './AdminShared';

export const BlockersTab = ({
  blockers,
  loading,
  onRefresh,
  onApprove,
  onReject,
  onRevise,
  onDelete,
  onCreateBlocker,
  onResetPassword,
  onSuspend,
}) => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBlocker, setSelectedBlocker] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newBlockerForm, setNewBlockerForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    areaText: '',
    username: '',
    password: '',
    status: 'APPROVED',
  });

  const generateTempPwd = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setNewBlockerForm((p) => ({ ...p, password: `Guraaha@${num}` }));
  };

  const handleOpenAdd = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setNewBlockerForm({
      fullName: '',
      phone: '',
      email: '',
      nationalId: '',
      areaText: '',
      username: '',
      password: `Guraaha@${num}`,
      status: 'APPROVED',
    });
    setAddModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!onCreateBlocker) return;
    await onCreateBlocker(newBlockerForm);
    setAddModalOpen(false);
  };

  const count = (s) => blockers.filter((b) => b.status === s).length;
  const counts = {
    ALL: blockers.length,
    PENDING: count('PENDING'),
    APPROVED: count('APPROVED'),
    SUSPENDED: count('SUSPENDED'),
    REJECTED: count('REJECTED'),
  };

  const visible =
    statusFilter === 'ALL'
      ? blockers
      : blockers.filter((b) => b.status === statusFilter);

  return (
    <>
      <Panel
        icon={Users}
        title={`All Blockers (${blockers.length})`}
        actions={
          <div className="flex items-center gap-2">
            {onCreateBlocker && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="h-9 px-3.5 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold cursor-pointer"
              >
                + Add Blocker
              </button>
            )}
            <RefreshButton onClick={onRefresh} loading={loading} />
          </div>
        }
      >
        <StatusFilter counts={counts} active={statusFilter} onChange={setStatusFilter} />

        {loading ? (
          <LoadingState />
        ) : visible.length > 0 ? (
          <div className="overflow-x-auto">
            {/* Exact columns: Blocker | Code | Phone | National ID | Area | Listings | Plan | Status | Actions */}
            <table className={`${tableClass} min-w-[960px]`}>
              <thead className={theadClass}>
                <tr>
                  <th className="py-3 px-3.5">Blocker</th>
                  <th className="py-3 px-3.5">Code</th>
                  <th className="py-3 px-3.5">Phone</th>
                  <th className="py-3 px-3.5">National ID</th>
                  <th className="py-3 px-3.5">Area</th>
                  <th className="py-3 px-3.5">Listings</th>
                  <th className="py-3 px-3.5">Plan</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={tbodyClass}>
                {visible.map((app) => {
                  const fullName =
                    `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Unnamed';
                  const isPending = app.status === 'PENDING';
                  const isApproved = app.status === 'APPROVED';
                  const isSuspended = app.status === 'SUSPENDED';
                  const isRejected = app.status === 'REJECTED';
                  const areaDisplay =
                    app.area_text ||
                    app.operating_location_path ||
                    app.operating_location_name ||
                    '—';
                  const listingCount = Number(app.listing_count ?? 0);
                  const activePlan = app.active_plan || 'None';

                  const rowActions = [
                    { label: 'View details', icon: Eye, onClick: () => setSelectedBlocker(app) },
                  ];
                  if (isPending) {
                    rowActions.push(
                      { label: 'Approve', icon: Check, onClick: () => onApprove(app.id) },
                      { label: 'Request revision', icon: Pencil, onClick: () => onRevise(app.id) },
                      { label: 'Reject', icon: X, destructive: true, onClick: () => onReject(app.id) }
                    );
                  }
                  if (isApproved || isSuspended) {
                    if (onSuspend) {
                      rowActions.push({
                        label: isSuspended ? 'Reactivate blocker' : 'Suspend blocker',
                        icon: Ban,
                        onClick: () => onSuspend(app.id),
                      });
                    }
                    rowActions.push({
                      label: 'Remove from public (Revoke)',
                      icon: Ban,
                      destructive: true,
                      onClick: () => onReject(app.id),
                    });
                  }
                  if (isRejected) {
                    rowActions.push({
                      label: 'Re-approve blocker',
                      icon: Check,
                      onClick: () => onApprove(app.id),
                    });
                  }
                  if (onResetPassword) {
                    rowActions.push({
                      label: '🔑 Reset temporary password',
                      icon: Pencil,
                      onClick: () => onResetPassword(app),
                    });
                  }
                  if (onDelete) {
                    rowActions.push({
                      label: 'Delete permanently',
                      icon: Trash2,
                      destructive: true,
                      onClick: () => onDelete(app.id),
                    });
                  }
                  return (
                    <tr key={app.id} className={rowClass}>
                      <td className="py-3 px-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedBlocker(app)}
                          className="font-semibold text-brand-ink hover:text-brand-green hover:underline text-left cursor-pointer block"
                        >
                          {fullName}
                        </button>
                        {app.username && (
                          <span className="font-mono text-[11px] font-bold text-brand-green-dark">
                            @{app.username}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-xs font-bold text-brand-green-dark">
                        {app.verification_code || '—'}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-xs text-brand-ink">
                        {app.phone || '—'}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-xs text-brand-ink-soft">
                        {app.national_id || '—'}
                      </td>
                      <td className="py-3 px-3.5 text-xs text-brand-ink">{areaDisplay}</td>
                      <td className="py-3 px-3.5 text-xs font-bold text-brand-ink">
                        {listingCount}
                      </td>
                      <td className="py-3 px-3.5 text-xs">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            activePlan !== 'None'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {activePlan}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
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
          <EmptyState>No blockers with status &quot;{statusFilter}&quot; found.</EmptyState>
        )}
      </Panel>

      {/* Add Blocker Modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-[14px] border border-brand-line p-6 w-full max-w-lg shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-brand-bg-soft text-brand-ink-soft cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-brand-ink mb-4">Add New Blocker Account</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBlockerForm.fullName}
                    onChange={(e) =>
                      setNewBlockerForm((p) => ({ ...p, fullName: e.target.value }))
                    }
                    placeholder="Jean-Claude Niyonzima"
                    className="w-full h-10 px-3 rounded-[9px] border border-brand-line text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Phone (MoMo) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBlockerForm.phone}
                    onChange={(e) =>
                      setNewBlockerForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="078..."
                    className="w-full h-10 px-3 rounded-[9px] border border-brand-line text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    National ID (16 digits) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBlockerForm.nationalId}
                    onChange={(e) =>
                      setNewBlockerForm((p) => ({ ...p, nationalId: e.target.value }))
                    }
                    placeholder="1 19xx x xxxxxxx x xx"
                    className="w-full h-10 px-3 rounded-[9px] border border-brand-line text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Primary Area (District &amp; Sector) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBlockerForm.areaText}
                    onChange={(e) =>
                      setNewBlockerForm((p) => ({ ...p, areaText: e.target.value }))
                    }
                    placeholder="e.g. Kimironko, Gasabo"
                    className="w-full h-10 px-3 rounded-[9px] border border-brand-line text-sm"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-[10px] bg-brand-bg-soft border border-brand-line space-y-3">
                <div className="text-xs font-bold text-brand-green-dark">
                  🔐 Login Credentials
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-ink mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBlockerForm.username}
                      onChange={(e) =>
                        setNewBlockerForm((p) => ({ ...p, username: e.target.value }))
                      }
                      placeholder="e.g. jean.n"
                      autoCapitalize="none"
                      className="w-full h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-ink mb-1">
                      Temporary Password *
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        value={newBlockerForm.password}
                        onChange={(e) =>
                          setNewBlockerForm((p) => ({ ...p, password: e.target.value }))
                        }
                        className="w-full h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={generateTempPwd}
                        className="h-10 px-2.5 rounded-[9px] border border-brand-line bg-white text-xs font-semibold cursor-pointer"
                        title="Generate random temporary password"
                      >
                        🎲
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm cursor-pointer"
                >
                  Create Blocker Account
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="h-10 px-5 rounded-[9px] border border-brand-line text-brand-ink font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  {`${selectedBlocker.first_name || ''} ${selectedBlocker.last_name || ''}`.trim() ||
                    'Unnamed'}
                </div>
                {selectedBlocker.username && (
                  <div className="text-xs font-mono font-bold text-brand-green-dark">
                    Username: @{selectedBlocker.username}
                  </div>
                )}
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
                    {selectedBlocker.national_id || '—'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-brand-line bg-white">
                  <div className="text-xs text-brand-ink-soft flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-green" />
                    <span>Operating Area</span>
                  </div>
                  <div className="text-sm font-bold text-brand-ink">
                    {selectedBlocker.area_text ||
                      selectedBlocker.operating_location_path ||
                      selectedBlocker.operating_location_name ||
                      'Not specified'}
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
                {selectedBlocker.status === 'PENDING' && (
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

                {selectedBlocker.status === 'APPROVED' && (
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
                    Remove from Public
                  </Button>
                )}

                {selectedBlocker.status === 'REJECTED' && (
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