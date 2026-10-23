import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  formatStatus,
  listingLocationLine,
  listingTitle,
} from "../../utils/listing";
import {
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
} from "lucide-react";

export const MyPropertiesTab = ({ listings, onNavigate }) => {
  const approved = listings.filter((l) => l.status === "APPROVED" || !l.status).length;
  const pending = listings.filter((l) => l.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* 4-column metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* Total Properties */}
        <Card className="rounded-[9px] border-brand-line p-5 bg-white shadow-xs min-h-[148px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-ink-soft uppercase tracking-wider">
              Total Properties
            </span>
            <div className="w-8 h-8 rounded-[7px] bg-brand-bg-soft flex items-center justify-center text-brand-green">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold text-brand-ink tracking-tight leading-none">
              {listings.length}
            </span>
            <span className="text-xs text-brand-ink-soft font-medium">properties listed</span>
          </div>
        </Card>

        {/* Live on Site */}
        <Card className="rounded-[9px] border-brand-line p-5 bg-white shadow-xs min-h-[148px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-ink-soft uppercase tracking-wider">
              Live on Site
            </span>
            <div className="w-8 h-8 rounded-[7px] bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold text-brand-green tracking-tight leading-none">
              {approved}
            </span>
            <span className="text-xs text-emerald-700 font-medium">approved & live</span>
          </div>
        </Card>

        {/* Pending Review */}
        <Card className="rounded-[9px] border-brand-line p-5 bg-white shadow-xs min-h-[148px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-ink-soft uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-[7px] bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold text-brand-ink tracking-tight leading-none">
              {pending}
            </span>
            <span className="text-xs text-amber-700 font-medium">in compliance</span>
          </div>
        </Card>

        {/* Column 4: subscription card (65%) + add button (30%) + 5% gap */}
        <div className="min-h-[148px] flex flex-col justify-between gap-[5%]">
          <Card className="h-[65%] rounded-[9px] border-brand-line bg-white shadow-xs p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-extrabold text-brand-ink tracking-tight block">
                Blocker Pro
              </span>
              <button
                type="button"
                onClick={() => onNavigate("subscription")}
                className="text-xs font-bold text-brand-green bg-brand-green/10 hover:underline cursor-pointer"
              >
                change plan
              </button>
            </div>

            <div className="my-auto py-1 text-center">
              <span className="inline-flex items-center text-xs font-bold text-brand-green bg-brand-green/10">
                Active
              </span>
            </div>

            <div className="w-full pb-1 flex items-center justify-center text-xs text-brand-ink-soft">
              <span className="font-medium text-brand-ink-soft">Monthly renews 05 Oct</span>
            </div>
          </Card>

          <Button
            onClick={() => onNavigate("add")}
            variant="default"
            className="h-[30%] w-full rounded-[9px] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Add New Property</span>
          </Button>
        </div>
      </div>

      {/* Listings table */}
      <Card className="rounded-[9px] border-brand-line bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-brand-line/60 flex items-center justify-between">
          <h3 className="font-bold text-base text-brand-ink">Managed Properties</h3>
          <span className="text-xs text-brand-ink-soft">
            {listings.length} properties total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-brand-bg-soft/60 border-b border-brand-line text-xs font-semibold text-brand-ink-soft">
              <tr>
                <th className="py-3 px-4">Property</th>
                <th className="py-1 px-1">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Price (RWF)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-1 px-1">Unlocks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line/60">
              {listings.map((item) => (
                <tr key={item.id} className="hover:bg-brand-bg-soft/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-brand-ink">
                    {listingTitle(item)}
                  </td>
                  <td className="py-1 px-1 capitalize text-brand-ink-soft text-xs font-semibold">
                    {item.type || "Plot"}
                  </td>
                  <td className="py-3 px-4 text-brand-ink-soft text-xs">
                    {listingLocationLine(item)}
                  </td>
                  <td className="py-3 px-4 font-bold text-brand-green">
                    {Number(item.priceRwf || item.price || 0).toLocaleString()} RWF
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold rounded-[6px] ${
                        item.status === "APPROVED" || !item.status
                          ? "text-brand-green"
                          : item.status === "PENDING" || item.status === "NEEDS_REVISION"
                          ? "text-amber-800"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {(item.status === "APPROVED" || !item.status) && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                      )}
                      {item.status === "PENDING" && (
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                      )}
                      {item.status === "NEEDS_REVISION" && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      )}
                      {item.status === "REJECTED" && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      )}
                      {formatStatus(item.status || "APPROVED")}
                    </span>
                  </td>
                  <td className="py-1 px-1 text-xs font-semibold text-brand-ink-soft">
                    2
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-ink-soft">
                    <Building2 className="w-8 h-8 text-brand-line mx-auto mb-2" />
                    <p className="font-semibold text-brand-ink">No properties listed yet.</p>
                    <p className="text-xs text-brand-ink-soft mt-1">
                      Click "Add New Property" to submit your first land or house listing.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};