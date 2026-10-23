import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

/* -- Helpers ------------------------------------------------ */
export const isSubActive = (s) =>
  s.status === "ACTIVE" && new Date(s.expires_at) > new Date();

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "-";

/* -- Status badge ------------------------------------------- */
const BADGE = {
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  NEEDS_REVISION: "bg-orange-100 text-orange-800 border-orange-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  EXPIRED: "bg-gray-100 text-gray-600 border-gray-200",
};

export const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-[6px] border whitespace-nowrap ${
      BADGE[status] || "bg-gray-100 text-gray-700 border-gray-200"
    }`}
  >
    {status?.replace(/_/g, " ") || "-"}
  </span>
);

/* -- Status filter pill row --------------------------------- */
const FILTER_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED", "NEEDS_REVISION"];

export const StatusFilter = ({ counts, active, onChange }) => (
  <div className="flex flex-wrap gap-2 mb-4">
    {FILTER_TABS.map((s) => (
      <Button
        key={s}
        type="button"
        size="sm"
        variant={active === s ? "default" : "outline"}
        onClick={() => onChange(s)}
        className="rounded-[9px] font-bold"
      >
        {s.replace(/_/g, " ")} {counts[s] !== undefined ? `(${counts[s]})` : ""}
      </Button>
    ))}
  </div>
);

/* -- Refresh icon button ------------------------------------ */
export const RefreshButton = ({ onClick, loading }) => (
  <Button
    type="button"
    variant="outline"
    size="icon-sm"
    onClick={onClick}
    disabled={loading}
    className="rounded-[9px]"
    title="Refresh"
  >
    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
  </Button>
);

/* -- Panel: card with titled header ------------------------- */
export const Panel = ({ icon: Icon, title, subtitle, actions, children }) => (
  <Card className="rounded-[9px] border-brand-line bg-white shadow-xs overflow-hidden">
    <div className="p-4 sm:p-5 border-b border-brand-line/60 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-bold text-base text-brand-ink flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-brand-green shrink-0" />}
          <span className="truncate">{title}</span>
        </h3>
        {subtitle && <p className="text-xs text-brand-ink-soft mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </Card>
);

/* -- Loading + empty states --------------------------------- */
export const LoadingState = ({ label = "Loading..." }) => (
  <div className="py-12 flex items-center justify-center text-brand-ink-soft text-sm">
    <Loader2 className="w-5 h-5 animate-spin text-brand-green mr-2" /> {label}
  </div>
);

export const EmptyState = ({ children }) => (
  <p className="text-sm text-brand-ink-soft py-8 text-center bg-brand-bg-soft/50 rounded-[9px]">
    {children}
  </p>
);

/* -- Shared table class names ------------------------------- */
export const tableClass = "w-full text-left text-sm";
export const theadClass =
  "bg-brand-bg-soft/60 border-b border-brand-line text-xs font-semibold text-brand-ink-soft";
export const tbodyClass = "divide-y divide-brand-line/60";
export const rowClass = "hover:bg-brand-bg-soft/40 transition-colors";