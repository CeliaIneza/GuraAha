import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import {
  formatStatus,
  isRentListing,
  listingCategory,
  listingLocationLine,
  listingPrice,
  listingSubType,
  listingTitle,
} from '../../utils/listing';
import {
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';

export const MyPropertiesTab = ({
  listings,
  subscription,
  onNavigate,
  onToggleDisabled,
  onDelete,
}) => {
  const navigate = useNavigate();
  const approved = listings.filter((l) => l.status === 'APPROVED' || !l.status).length;
  const pending = listings.filter((l) => l.status === 'PENDING').length;
  const totalUnlocks = listings.reduce(
    (sum, l) => sum + Number(l.unlock_count ?? l.unlockCount ?? 0),
    0
  );

  const blockerSub = subscription?.blockerSubscription;
  const subActive = Boolean(blockerSub?.isActive);
  const subExpiresAt =
    blockerSub?.subscription?.expires_at ||
    blockerSub?.subscription?.expiresAt ||
    null;

  return (
    <div className="space-y-6">
      {/* 4-column metric cards: Total Properties | Live on Site | Total Contact Unlocks | Blocker Pro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* Total Properties */}
        <Card className="rounded-[9px] border-brand-line p-5 bg-white shadow-xs min-h-[140px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-ink-soft uppercase tracking-wider">
              My Listings
            </span>
            <div className="w-8 h-8 rounded-[7px] bg-brand-bg-soft flex items-center justify-center text-brand-green">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-brand-ink tracking-tight leading-none">
              {listings.length}
            </span>
            <span className="text-xs text-brand-ink-soft font-medium">
              ({pending} pending)
            </span>
          </div>
        </Card>

        {/* Live on Site */}
        <Card className="rounded-[9px] border-brand-line p-5 bg-white shadow-xs min-h-[140px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-ink-soft uppercase tracking-wider">
              Approved &amp; Live
            </span>
            <div className="w-8 h-8 rounded-[7px] bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-brand-green tracking-tight leading-none">
              {approved}
            </span>
            <span className="text-xs text-emerald-700 font-medium">public on site</span>
          </div>
        </Card>

        {/* Contact Unlocks */}
        <Card className="rounded-[9px] border-brand-line p-5 bg-white shadow-xs min-h-[140px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-ink-soft uppercase tracking-wider">
              Contact Unlocks
            </span>
            <div className="w-8 h-8 rounded-[7px] bg-amber-50 flex items-center justify-center text-amber-600">
              <Unlock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-brand-ink tracking-tight leading-none">
              {totalUnlocks}
            </span>
            <span className="text-xs text-brand-ink-soft font-medium">paid buyer leads</span>
          </div>
        </Card>

        {/* Subscription status card */}
        <Card className="rounded-[9px] border-brand-line bg-white shadow-xs min-h-[140px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-brand-ink uppercase tracking-wider">
              Blocker Pro Plan
            </span>
            <button
              type="button"
              onClick={() => onNavigate('subscription')}
              className="text-xs font-bold text-brand-green bg-brand-green/10 hover:underline cursor-pointer px-2 py-0.5 rounded-[5px]"
            >
              {subActive ? 'Manage' : 'Subscribe'}
            </button>
          </div>

          <div className="my-auto py-1">
            <span
              className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-[5px] ${
                subActive
                  ? 'text-brand-green bg-brand-green/10'
                  : 'text-amber-700 bg-amber-50'
              }`}
            >
              {subActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="w-full text-xs text-brand-ink-soft">
            {subActive && subExpiresAt
              ? `Valid until ${new Date(subExpiresAt).toLocaleDateString()}`
              : 'Required to post listings'}
          </div>
        </Card>
      </div>

      {/* Add New Property CTA */}
      <div className="flex justify-end">
        <Button
          onClick={() => onNavigate('add')}
          variant="default"
          className="rounded-[9px] font-bold text-sm flex items-center gap-2 shadow-xs cursor-pointer px-5 h-10"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>+ Post New Listing</span>
        </Button>
      </div>

      {/* Listings Table: Property | Type | Location | Price | Status | Unlocks | Actions */}
      <Card className="rounded-[9px] border-brand-line bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-brand-line/60 flex items-center justify-between">
          <h3 className="font-bold text-base text-brand-ink">My Listings</h3>
          <span className="text-xs text-brand-ink-soft">
            {listings.length} properties · {totalUnlocks} contact unlocks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[780px]">
            <thead className="bg-brand-bg-soft/60 border-b border-brand-line text-xs font-semibold text-brand-ink-soft">
              <tr>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Unlocks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line/60">
              {listings.map((item) => {
                const isRent = isRentListing(item);
                const cat = listingCategory(item);
                const sub = listingSubType(item);
                const typeLabel =
                  cat && sub && cat.toLowerCase() !== sub.toLowerCase()
                    ? `${cat} · ${sub}`
                    : cat || sub || item.type || 'Plot';
                return (
                  <tr key={item.id} className="hover:bg-brand-bg-soft/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-brand-ink">{listingTitle(item)}</div>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isRent
                            ? 'bg-[#E5ECF6] text-[#1D3559]'
                            : 'bg-[#E0F2EE] text-[#00594A]'
                        }`}
                      >
                        {isRent ? 'For rent' : 'For sale'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-brand-ink-soft text-xs font-semibold">
                      {typeLabel}
                    </td>
                    <td className="py-3 px-4 text-brand-ink-soft text-xs">
                      {listingLocationLine(item) || ' '}
                    </td>
                    <td className="py-3 px-4 font-bold text-brand-green-dark text-xs">
                      {listingPrice(item).toLocaleString()} RWF
                      {isRent ? ' / mo' : ''}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold rounded-[6px] ${
                            item.status === 'APPROVED' || !item.status
                              ? 'text-brand-green'
                              : item.status === 'PENDING' || item.status === 'NEEDS_REVISION'
                              ? 'text-amber-800'
                              : 'bg-red-50 text-red-800 border border-red-200 px-1.5 py-0.5'
                          }`}
                        >
                          {(item.status === 'APPROVED' || !item.status) && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                          )}
                          {item.status === 'PENDING' && (
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                          )}
                          {item.status === 'NEEDS_REVISION' && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          )}
                          {item.status === 'REJECTED' && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          )}
                          {formatStatus(item.status || 'APPROVED')}
                        </span>
                        {item.is_disabled && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-brand-ink">
                      🔓 {Number(item.unlock_count ?? item.unlockCount ?? 0)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/listing/${item.id}`)}
                          className="h-8 px-2.5 rounded-[7px] border border-brand-line bg-white hover:bg-brand-bg-soft text-xs font-semibold text-brand-ink inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        {onToggleDisabled && (
                          <button
                            type="button"
                            onClick={() => onToggleDisabled(item.id)}
                            className="h-8 px-2.5 rounded-[7px] border border-brand-line bg-white hover:bg-brand-bg-soft text-xs font-semibold text-brand-ink inline-flex items-center gap-1 cursor-pointer"
                          >
                            {item.is_disabled ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-brand-green" />
                                <span>Enable</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                                <span>Disable</span>
                              </>
                            )}
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            className="h-8 px-2 rounded-[7px] border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer"
                            title="Delete listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-brand-ink-soft">
                    <Building2 className="w-8 h-8 text-brand-line mx-auto mb-2" />
                    <p className="font-semibold text-brand-ink">No properties listed yet.</p>
                    <p className="text-xs text-brand-ink-soft mt-1">
                      Click &quot;+ Post New Listing&quot; to submit your first land or house listing.
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