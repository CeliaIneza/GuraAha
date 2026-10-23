import React from "react";
import { CreditCard } from "lucide-react";
import {
  Panel,
  RefreshButton,
  StatusBadge,
  LoadingState,
  EmptyState,
  isSubActive,
  formatDate,
  tableClass,
  theadClass,
  tbodyClass,
  rowClass,
} from "./AdminShared";

export const SubscriptionsTab = ({ subscriptions, loading, onRefresh }) => {
  const activeCount = subscriptions.filter(isSubActive).length;
  const weekly = subscriptions.filter((s) => s.plan === "weekly").length;
  const monthly = subscriptions.filter((s) => s.plan === "monthly").length;

  return (
    <Panel
      icon={CreditCard}
      title={`All Subscriptions (${subscriptions.length})`}
      actions={<RefreshButton onClick={onRefresh} loading={loading} />}
    >
      <div className="flex flex-wrap gap-4 mb-4 p-3 bg-brand-bg-soft rounded-[9px] text-sm">
        <span>
          <b className="text-brand-green-dark">{activeCount}</b>{" "}
          <span className="text-brand-ink-soft">active</span>
        </span>
        <span>·</span>
        <span>
          <b>{weekly}</b> <span className="text-brand-ink-soft">weekly</span>
        </span>
        <span>·</span>
        <span>
          <b>{monthly}</b> <span className="text-brand-ink-soft">monthly</span>
        </span>
      </div>

      {loading ? (
        <LoadingState />
      ) : subscriptions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className={`${tableClass} min-w-[720px]`}>
            <thead className={theadClass}>
              <tr>
                <th className="py-3 px-4">Blocker</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Paid (RWF)</th>
                <th className="py-3 px-4">Starts</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {subscriptions.map((s) => (
                <tr key={s.id} className={rowClass}>
                  <td className="py-3 px-4 font-semibold text-brand-ink">
                    {`${s.first_name || ""} ${s.last_name || ""}`.trim() || "-"}
                    <div className="text-xs font-normal text-brand-ink-soft">{s.phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-[6px] text-xs font-bold ${
                        s.plan === "monthly"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {s.plan?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm font-bold text-brand-green-dark">
                    {Number(s.amount_rwf || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-xs text-brand-ink-soft">
                    {formatDate(s.starts_at)}
                  </td>
                  <td className="py-3 px-4 text-xs text-brand-ink-soft">
                    {formatDate(s.expires_at)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={isSubActive(s) ? "ACTIVE" : "EXPIRED"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState>No subscriptions yet.</EmptyState>
      )}
    </Panel>
  );
};