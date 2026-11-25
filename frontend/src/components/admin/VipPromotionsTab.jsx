import React from 'react';
import { adminApi } from '../../api/admin';
import { listingsApi } from '../../api/listings';
import { useApp } from '../../context/AppContext';
import { listingTitle } from '../../utils/listing';
import { Star, Globe, Bell, Check, X } from 'lucide-react';
import { RowActions } from './RowActions';
import {
  Panel,
  RefreshButton,
  StatusBadge,
  LoadingState,
  EmptyState,
  tableClass,
  theadClass,
  tbodyClass,
  rowClass,
} from './AdminShared';

export const VipPromotionsTab = ({ listings = [], loading, onRefresh, showToast }) => {
  const { settings } = useApp();
  const minDiscount = Number(settings?.vipMinDiscount || 10);

  const vipListings = listings.filter((l) => l.is_vip || l.vip);

  const handleMakePublicNow = async (l) => {
    try {
      await adminApi.endVipPromotion(l.id);
      showToast(`🌍 "${l.title || listingTitle(l)}" is now public on the main site.`);
      onRefresh?.();
    } catch (err) {
      showToast(err.message || 'Failed to move listing to public site');
    }
  };

  const handleSendAlert = async (l) => {
    try {
      await adminApi.sendVipAlert(l.id);
      showToast(`📣 VIP deal alert sent via WhatsApp & Email for "${l.title || listingTitle(l)}".`);
    } catch (err) {
      showToast(err.message || 'Failed to send VIP alert');
    }
  };

  const handleApproveVip = async (l, discPct) => {
    if (discPct < minDiscount) {
      showToast(`Discount (${discPct}%) is below the minimum required VIP discount (${minDiscount}%).`);
      return;
    }
    try {
      await listingsApi.approveVip(l.id, Number(settings?.vipDays || 7));
      showToast('⭐ VIP promotion approved and alert dispatched!');
      onRefresh?.();
    } catch (err) {
      showToast(err.message || 'Failed to approve VIP deal');
    }
  };

  const handleRejectVip = async (l) => {
    const reason = window.prompt('Reason for rejecting VIP promotion:', 'Discount below threshold');
    if (!reason) return;
    try {
      await listingsApi.reject(l.id, reason);
      showToast('VIP promotion rejected.');
      onRefresh?.();
    } catch (err) {
      showToast(err.message || 'Failed to reject VIP deal');
    }
  };

  const getDaysRemaining = (l) => {
    const exp = l.vip_expires_at || l.vipExpiresAt;
    if (!exp) return `${l.vip_early_access_days || settings?.vipDays || 7} days`;
    const diff = new Date(exp).getTime() - Date.now();
    const d = Math.max(0, Math.ceil(diff / 86400000));
    return `${d} days`;
  };

  return (
    <Panel
      icon={Star}
      title={`VIP Promotions (${vipListings.length})`}
      subtitle={`Minimum required VIP discount: ${minDiscount}% below public price · Early-access window: ${
        settings?.vipDays || 7
      } days`}
      actions={<RefreshButton onClick={onRefresh} loading={loading} />}
    >
      {loading && vipListings.length === 0 ? (
        <LoadingState />
      ) : vipListings.length > 0 ? (
        <div className="overflow-x-auto">
          {/* Exact columns: Property | Blocker | Public price | VIP price | Discount check | Public in | Status | Actions */}
          <table className={`${tableClass} min-w-[880px]`}>
            <thead className={theadClass}>
              <tr>
                <th className="py-3 px-3.5">Property</th>
                <th className="py-3 px-3.5">Blocker</th>
                <th className="py-3 px-3.5">Public price</th>
                <th className="py-3 px-3.5">VIP price</th>
                <th className="py-3 px-3.5">Discount check</th>
                <th className="py-3 px-3.5">Public in</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {vipListings.map((l) => {
                const title = l.title || listingTitle(l);
                const blocker =
                  `${l.blocker_first_name || ''} ${l.blocker_last_name || ''}`.trim() ||
                  l.blocker ||
                  'Blocker';
                const vipPrice = Number(l.price_rwf || l.price || 0);
                const publicPrice = Number(
                  l.vip_was_price_rwf || l.was || Math.round(vipPrice * 1.2)
                );
                const discPct =
                  publicPrice > vipPrice
                    ? Math.round(((publicPrice - vipPrice) / publicPrice) * 100)
                    : Number(l.vip_discount_percent || 0);
                const passesCheck = discPct >= minDiscount;

                const rowActions = [];
                if (l.status === 'PENDING') {
                  rowActions.push(
                    {
                      label: 'Approve VIP promotion',
                      icon: Check,
                      onClick: () => handleApproveVip(l, discPct),
                    },
                    {
                      label: 'Reject VIP promotion',
                      icon: X,
                      destructive: true,
                      onClick: () => handleRejectVip(l),
                    }
                  );
                }
                rowActions.push(
                  {
                    label: '📣 Send deal alert',
                    icon: Bell,
                    onClick: () => handleSendAlert(l),
                  },
                  {
                    label: '🌍 Make public now',
                    icon: Globe,
                    onClick: () => handleMakePublicNow(l),
                  }
                );

                return (
                  <tr key={l.id} className={rowClass}>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-brand-ink">{title}</div>
                      {l.vip_reason && (
                        <div className="text-[11px] text-brand-ink-soft line-clamp-1 max-w-xs">
                          {l.vip_reason}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-xs">
                      <div className="font-medium text-brand-ink">{blocker}</div>
                      {l.blocker_verification_code && (
                        <span className="font-mono text-[11px] text-brand-green-dark">
                          {l.blocker_verification_code}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-xs text-brand-ink-soft line-through whitespace-nowrap">
                      {publicPrice.toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-3.5 text-xs font-extrabold text-brand-green-dark whitespace-nowrap">
                      {vipPrice.toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-3.5 text-xs whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${
                          passesCheck
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        −{discPct}% {passesCheck ? `✓ (≥${minDiscount}%)` : `✗ (<${minDiscount}%)`}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-xs font-semibold text-amber-800 whitespace-nowrap">
                      ⏳ {getDaysRemaining(l)}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <RowActions
                        label={`Actions for ${title}`}
                        actions={rowActions}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState>No VIP Room promotions currently active or pending.</EmptyState>
      )}
    </Panel>
  );
};
