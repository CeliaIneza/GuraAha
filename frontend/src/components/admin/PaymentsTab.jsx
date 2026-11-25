import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { CreditCard, RotateCcw, RefreshCw } from 'lucide-react';
import {
  Panel,
  RefreshButton,
  LoadingState,
  EmptyState,
  formatDate,
  tableClass,
  theadClass,
  tbodyClass,
  rowClass,
} from './AdminShared';

export const PaymentsTab = ({ showToast }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllPayments();
      if (Array.isArray(res?.data)) {
        setPayments(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleRefund = async (p) => {
    if (
      !window.confirm(
        `Mark payment ${p.provider_reference || p.id.slice(0, 8)} (${Number(
          p.amount_rwf || 0
        ).toLocaleString()} RWF) as REFUNDED and revoke access?`
      )
    ) {
      return;
    }
    try {
      await adminApi.refundPayment(p.id);
      showToast('Payment refunded and linked unlock / subscription revoked.');
      loadPayments();
    } catch (err) {
      showToast(err.message || 'Failed to refund payment');
    }
  };

  const handleRecheck = async (p) => {
    try {
      await adminApi.recheckPayment(p.id);
      showToast('Payment status re-checked and marked PAID.');
      loadPayments();
    } catch (err) {
      showToast(err.message || 'Failed to re-check payment');
    }
  };

  const completedRevenue = payments
    .filter(
      (p) =>
        p.status === 'COMPLETED' || p.status === 'PAID' || p.status === 'SUCCESSFUL'
    )
    .reduce((sum, p) => sum + Number(p.amount_rwf || 0), 0);

  return (
    <Panel
      icon={CreditCard}
      title={`MoMo & Airtel Money Payments (${payments.length})`}
      subtitle={`Total confirmed revenue: ${completedRevenue.toLocaleString('en-US')} RWF`}
      actions={<RefreshButton onClick={loadPayments} loading={loading} />}
    >
      {loading && payments.length === 0 ? (
        <LoadingState />
      ) : payments.length > 0 ? (
        <div className="overflow-x-auto">
          {/* Exact columns: Date | Phone | Type | Reference | Amount | Provider | Transaction | Status | Actions */}
          <table className={`${tableClass} min-w-[960px]`}>
            <thead className={theadClass}>
              <tr>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Phone</th>
                <th className="py-3 px-3.5">Type</th>
                <th className="py-3 px-3.5">Reference</th>
                <th className="py-3 px-3.5">Amount</th>
                <th className="py-3 px-3.5">Provider</th>
                <th className="py-3 px-3.5">Transaction</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {payments.map((p) => {
                const status = (p.status || 'PENDING').toUpperCase();
                const displayStatus =
                  status === 'COMPLETED' || status === 'SUCCESSFUL' ? 'PAID' : status;
                const phone =
                  p.metadata?.phone || p.phone_used || p.phone || p.user_phone || '—';
                const typeLabel =
                  p.metadata?.type ||
                  p.purpose ||
                  'CONTACT_UNLOCK';
                const refLabel =
                  p.listing_title ||
                  p.metadata?.plan ||
                  p.metadata?.listingId ||
                  'Platform Fee';
                const providerLabel = (p.provider || 'MTN_MOMO')
                  .replace('_', ' ')
                  .toUpperCase();
                const txnId =
                  p.provider_reference ||
                  p.metadata?.intouchTransactionId ||
                  `TXN-${String(p.id).slice(0, 8).toUpperCase()}`;

                return (
                  <tr key={p.id} className={rowClass}>
                    <td className="py-3 px-3.5 text-xs text-brand-ink-soft whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-xs font-semibold text-brand-ink">
                      {phone}
                    </td>
                    <td className="py-3 px-3.5 text-xs font-medium text-brand-ink">
                      {typeLabel}
                    </td>
                    <td className="py-3 px-3.5 text-xs text-brand-ink-soft max-w-[180px] truncate">
                      {refLabel}
                    </td>
                    <td className="py-3 px-3.5 text-xs font-extrabold text-brand-green-dark whitespace-nowrap">
                      {Number(p.amount_rwf || 0).toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-3.5 text-xs font-semibold text-brand-ink">
                      {providerLabel}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-xs text-brand-ink-soft">
                      {txnId}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          displayStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : displayStatus === 'REFUNDED'
                            ? 'bg-purple-100 text-purple-800'
                            : displayStatus === 'FAILED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {displayStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {(displayStatus === 'PENDING' || displayStatus === 'FAILED') && (
                          <button
                            type="button"
                            onClick={() => handleRecheck(p)}
                            className="h-8 px-2.5 rounded-[7px] border border-brand-green text-brand-green hover:bg-brand-green hover:text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Re-check</span>
                          </button>
                        )}
                        {displayStatus === 'PAID' && (
                          <button
                            type="button"
                            onClick={() => handleRefund(p)}
                            className="h-8 px-2.5 rounded-[7px] border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Refund</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState>No MoMo payment transactions recorded yet.</EmptyState>
      )}
    </Panel>
  );
};
