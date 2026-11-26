import React, { useMemo } from 'react';
import { BarChart3, Activity, TrendingUp } from 'lucide-react';
import { Panel, formatDate } from './AdminShared';

export const OverviewTab = ({
  blockers = [],
  listings = [],
  subscriptions = [],
  payments = [],
  auditLogs = [],
}) => {
  const approvedListings = listings.filter((l) => l.status === 'APPROVED').length;
  const pendingListings = listings.filter((l) => l.status === 'PENDING').length;
  const vipListings = listings.filter((l) => l.is_vip || l.vip).length;
  const approvedBlockers = blockers.filter((b) => b.status === 'APPROVED').length;
  const pendingBlockers = blockers.filter((b) => b.status === 'PENDING').length;
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const paidPayments = payments.filter(
    (p) => p.status === 'COMPLETED' || p.status === 'PAID' || p.status === 'SUCCESSFUL'
  ).length;

  // Build 6-month trend points strictly from real database timestamps
  const chartMonths = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const buckets = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        year: d.getFullYear(),
        monthIdx: d.getMonth(),
        month: monthNames[d.getMonth()],
        listings: 0,
        blockers: 0,
        subscriptions: 0,
      });
    }

    const addToBucket = (dateRaw, field) => {
      const dt = dateRaw ? new Date(dateRaw) : now;
      const validDate = isNaN(dt.getTime()) ? now : dt;
      const b = buckets.find(
        (m) => m.year === validDate.getFullYear() && m.monthIdx === validDate.getMonth()
      );
      if (b) {
        b[field] += 1;
      } else if (buckets.length > 0) {
        buckets[buckets.length - 1][field] += 1;
      }
    };

    listings.forEach((l) => addToBucket(l.created_at || l.createdAt, 'listings'));
    blockers.forEach((b) => addToBucket(b.created_at || b.createdAt, 'blockers'));
    subscriptions.forEach((s) =>
      addToBucket(s.created_at || s.createdAt || s.starts_at || s.startsAt, 'subscriptions')
    );

    return buckets;
  }, [listings, blockers, subscriptions]);

  const maxChartVal = useMemo(() => {
    const m = Math.max(
      1,
      ...chartMonths.map((c) => Math.max(c.listings, c.blockers, c.subscriptions))
    );
    return m;
  }, [chartMonths]);

  // Distribution bars for current database breakdown
  const breakdownItems = [
    {
      label: 'Live Approved Listings',
      count: approvedListings,
      total: listings.length,
      color: 'bg-[#007A66]',
    },
    {
      label: 'Listings Pending Review',
      count: pendingListings,
      total: listings.length,
      color: 'bg-amber-500',
    },
    {
      label: 'VIP Room Exclusive Deals',
      count: vipListings,
      total: listings.length,
      color: 'bg-[#D3B42B]',
    },
    {
      label: 'Verified Active Blockers',
      count: approvedBlockers,
      total: blockers.length,
      color: 'bg-emerald-600',
    },
    {
      label: 'Active Pro & VIP Subscriptions',
      count: activeSubs,
      total: subscriptions.length,
      color: 'bg-[#2B4C7E]',
    },
    {
      label: 'Completed MoMo Transactions',
      count: paidPayments,
      total: payments.length,
      color: 'bg-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Platform Analytics & Growth Trends Graph */}
      <Panel
        icon={BarChart3}
        title="Platform Analytics & Trends"
        subtitle="Live statistics and monthly growth trends across Listings, Verified Blockers, and Subscriptions"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Multi-Series Trend Chart */}
          <div className="lg:col-span-7 p-4 sm:p-5 rounded-[12px] border border-brand-line bg-brand-bg-soft/30">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-green" />
                <span className="font-bold text-sm text-brand-ink">
                  6-Month Platform Activity Trend
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#007A66] inline-block" />
                  Listings ({listings.length})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#D3B42B] inline-block" />
                  Blockers ({blockers.length})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#2B4C7E] inline-block" />
                  Subscriptions ({subscriptions.length})
                </span>
              </div>
            </div>

            {/* Grouped Bar Chart */}
            <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-brand-line">
              {chartMonths.map((item) => {
                const lHeight = item.listings > 0 ? Math.max(10, Math.round((item.listings / maxChartVal) * 160)) : 2;
                const bHeight = item.blockers > 0 ? Math.max(10, Math.round((item.blockers / maxChartVal) * 160)) : 2;
                const sHeight = item.subscriptions > 0 ? Math.max(10, Math.round((item.subscriptions / maxChartVal) * 160)) : 2;

                return (
                  <div
                    key={`${item.year}-${item.month}`}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-44">
                      {/* Listings Bar */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[#00594A] mb-0.5">
                          {item.listings}
                        </span>
                        <div
                          className="w-3 sm:w-4 rounded-t-md bg-[#007A66] transition-all duration-300"
                          style={{ height: `${lHeight}px` }}
                          title={`Listings: ${item.listings}`}
                        />
                      </div>

                      {/* Blockers Bar */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[#9E8419] mb-0.5">
                          {item.blockers}
                        </span>
                        <div
                          className="w-3 sm:w-4 rounded-t-md bg-[#D3B42B] transition-all duration-300"
                          style={{ height: `${bHeight}px` }}
                          title={`Blockers: ${item.blockers}`}
                        />
                      </div>

                      {/* Subscriptions Bar */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[#2B4C7E] mb-0.5">
                          {item.subscriptions}
                        </span>
                        <div
                          className="w-3 sm:w-4 rounded-t-md bg-[#2B4C7E] transition-all duration-300"
                          style={{ height: `${sHeight}px` }}
                          title={`Subscriptions: ${item.subscriptions}`}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-ink-soft">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Live Distribution Breakdown */}
          <div className="lg:col-span-5 p-4 sm:p-5 rounded-[12px] border border-brand-line bg-white space-y-3.5">
            <div className="font-bold text-sm text-brand-ink">
              Live Database Status Breakdown
            </div>
            <div className="space-y-3">
              {breakdownItems.map((b) => {
                const pct = b.total > 0 ? Math.min(100, Math.round((b.count / b.total) * 100)) : 0;
                return (
                  <div key={b.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-brand-ink">{b.label}</span>
                      <span className="font-bold text-brand-ink">
                        {b.count}{' '}
                        <span className="text-brand-ink-soft font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-brand-bg-soft overflow-hidden">
                      <div
                        className={`h-full rounded-full ${b.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {(pendingBlockers > 0 || pendingListings > 0) && (
              <div className="mt-2 pt-3 border-t border-brand-line text-xs text-amber-800 font-semibold">
                ⏳ {pendingBlockers} blocker(s) and {pendingListings} listing(s) awaiting review in their tabs.
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* Recent Admin Audit Log */}
      <Panel
        icon={Activity}
        title="Recent Admin Audit Log"
        subtitle="Chronological history of administrative actions"
      >
        {Array.isArray(auditLogs) && auditLogs.length > 0 ? (
          <div className="divide-y divide-brand-line text-xs">
            {auditLogs.slice(0, 12).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                <span className="font-medium text-brand-ink">{log.action}</span>
                <span className="text-brand-ink-soft shrink-0">
                  {formatDate(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-brand-ink-soft py-3">
            Administrative actions performed during this session will appear here.
          </p>
        )}
      </Panel>
    </div>
  );
};
