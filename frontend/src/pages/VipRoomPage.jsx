import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { subscriptionsApi } from '../api/subscriptions';
import { listingsApi } from '../api/listings';
import { Star, Lock, Zap, TrendingDown, Bell } from 'lucide-react';
import { Button } from '../components/ui/button';

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysLeft(expiresAt) {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function listingTitle(l) {
  return l.title_en || l.titleEn || l.title || 'VIP Property';
}

function listingLocation(l) {
  if (l.location) {
    return [l.location.district, l.location.sector].filter(Boolean).join(', ');
  }
  return [l.dist, l.sect].filter(Boolean).join(', ');
}

function discountPct(l) {
  return l.vip_discount_percent != null
    ? l.vip_discount_percent
    : l.vipDiscountPercent != null
    ? l.vipDiscountPercent
    : null;
}

function vipDaysLeft(l) {
  return daysLeft(l.vip_expires_at || l.vipExpiresAt);
}

// ── VIP Deal Card ─────────────────────────────────────────────────────────────

function VipDealCard({ listing, isVipMember, onJoin }) {
  const discount = discountPct(listing);
  const days = vipDaysLeft(listing);
  const title = listingTitle(listing);
  const location = listingLocation(listing);
  const typeLabel = listing.type
    ? listing.type.charAt(0).toUpperCase() + listing.type.slice(1)
    : 'Property';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm relative">
      {/* Badges */}
      {discount != null && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-[#007A66] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{discount}% · VIP price
          </span>
        </div>
      )}
      {days > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-gray-800/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Public in {days}d
          </span>
        </div>
      )}

      {/* Image / blurred preview */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#0F2C26]/30 to-amber-700/20">
        {!isVipMember && (
          <div className="absolute inset-0 backdrop-blur-sm bg-white/20 z-10" />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[#007A66] text-sm">🔒</span>
          <span className="text-xs font-bold text-[#007A66]">VIP members only</span>
        </div>

        <p className="text-sm font-semibold text-gray-900 leading-snug mb-3 line-clamp-2">
          {isVipMember
            ? title
            : `${typeLabel}${location ? ' · ' + location : ''}${discount != null ? ' · ' + discount + '% below market' : ''}`}
        </p>

        {!isVipMember ? (
          <>
            <button
              onClick={onJoin}
              className="w-full py-2 bg-[#007A66] hover:bg-[#005a4d] text-white font-bold rounded-xl text-sm transition-colors"
            >
              Join to reveal
            </button>
            <div className="mt-3 space-y-1.5">
              <div className="h-2.5 w-3/4 bg-gray-200 rounded-full blur-[2px] opacity-70" />
              <div className="h-2.5 w-1/2 bg-gray-200 rounded-full blur-[2px] opacity-50" />
            </div>
          </>
        ) : (
          <Link
            to={`/listing/${listing.id}`}
            className="block w-full py-2 bg-[#007A66] hover:bg-[#005a4d] text-white font-bold rounded-xl text-sm transition-colors text-center"
          >
            View listing →
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Mock preview deals (shown to non-VIP users) ───────────────────────────────

const MOCK_VIP_DEALS = [
  { id: 'vip1', type: 'luxury', dist: 'Nyarugenge', sect: 'Kiyovu', vip_discount_percent: 18 },
  { id: 'vip2', type: 'land', dist: 'Karongi', sect: 'Rutsiro', vip_discount_percent: 19 },
  { id: 'vip3', type: 'commercial', dist: 'Gasabo', sect: 'Kimironko', vip_discount_percent: 15 },
  { id: 'vip4', type: 'commercial', dist: 'Nyarugenge', sect: 'CBD', vip_discount_percent: 13 },
  { id: 'vip5', type: 'house', dist: 'Gasabo', sect: 'Remera', vip_discount_percent: 12 },
  { id: 'vip6', type: 'land', dist: 'Bugesera', sect: 'Rilima', vip_discount_percent: 13 },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

export const VipRoomPage = () => {
  const { user } = useAuth();
  const { openMoMo, settings } = useApp();
  const navigate = useNavigate();

  const [vipStatus, setVipStatus] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState(null);

  const isVipMember = Boolean(vipStatus && vipStatus.isActive);

  // Load plans + VIP status
  useEffect(() => {
    subscriptionsApi
      .getPlans()
      .then((res) => { if (res && res.data) setPlans(res.data); })
      .catch(() => {});

    if (user) {
      subscriptionsApi
        .getVipStatus()
        .then((res) => { if (res && res.data) setVipStatus(res.data); })
        .catch(() => {});
    }
  }, [user]);

  // Load VIP deals
  useEffect(() => {
    setLoading(true);
    if (isVipMember) {
      listingsApi
        .getVipDeals({ pageSize: 12 })
        .then((res) => {
          const data = res && res.data;
          setDeals(data && data.length > 0 ? data : MOCK_VIP_DEALS);
        })
        .catch(() => setDeals(MOCK_VIP_DEALS))
        .finally(() => setLoading(false));
    } else {
      setDeals(MOCK_VIP_DEALS);
      setLoading(false);
    }
  }, [isVipMember]);

  // Weekly plan price
  const weeklyPlan = Array.isArray(plans)
    ? plans.find((p) => p.type === 'VIP_ROOM' && (p.period === 'WEEK' || (p.name && p.name.toLowerCase().includes('week'))))
    : plans?.VIP_ROOM_WEEKLY || null;
  const weeklyPrice = (weeklyPlan && weeklyPlan.priceRwf) || (settings && settings.vipRoomWeekly) || 2500;

  const handleJoin = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    openMoMo({
      kind: 'subscription-vip_room_weekly',
      amount: weeklyPrice,
      title: 'VIP Room Weekly Access',
      listingId: null,
    });
  };

  const avgDiscount = deals.length > 0
    ? Math.round(deals.reduce((s, d) => s + (discountPct(d) || 15), 0) / deals.length)
    : 15;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#1A2E1E] overflow-hidden">
        {/* Star decoration */}
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
            <polygon
              points="200,20 240,160 390,160 265,245 310,390 200,310 90,390 135,245 10,160 160,160"
              fill="#007A66"
            />
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#007A66]/20 border border-[#007A66]/40 text-[#007A66] text-xs font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-wider">
            <Star className="w-3 h-3 fill-[#007A66]" />
            VIP Subscribers Only
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            The VIP Room: hidden, cheap<br className="hidden sm:block" /> and pre-launch deals
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl leading-relaxed mb-8">
            Blockers and owners who want a fast, discreet sale list here first. VIP members see
            these properties 7 days before the public, often at below-market prices.
          </p>

          {/* Feature pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {[
              { icon: <Zap className="w-4 h-4 text-[#007A66]" />, title: 'Early access', desc: 'New listings 7 days before they go public' },
              { icon: <TrendingDown className="w-4 h-4 text-[#007A66]" />, title: 'Below-market prices', desc: 'Owners accept a discount for a quick, quiet sale' },
              { icon: <Lock className="w-4 h-4 text-[#007A66]" />, title: 'Free contact unlocks', desc: 'No 100 / 200 RWF fee on VIP deals' },
              { icon: <Bell className="w-4 h-4 text-[#007A66]" />, title: 'Deal alerts', desc: 'Instant SMS / WhatsApp when a deal drops in your district' },
            ].map((f) => (
              <div key={f.title} className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  {f.icon}
                  <span className="text-xs font-bold text-[#007A66]">{f.title}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          {isVipMember ? (
            <div className="inline-flex items-center gap-2 bg-[#007A66]/30 border border-green-500/40 text-green-400 text-sm font-bold px-5 py-2.5 rounded-xl">
              <Star className="w-4 h-4 fill-green-400" />
              VIP Active {vipStatus.remainingDays} days left
            </div>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={handleJoin}
                className="bg-[#007A66] hover:bg-[#005a4d] text-white font-bold px-6 py-3 rounded-xl text-base shadow-lg transition-colors"
              >
                Join the VIP Room from {weeklyPrice.toLocaleString()} RWF / week
              </button>
              <p className="text-gray-500 text-sm">
                412 members · cancel any time · pay by MoMo
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── This week's VIP deals ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 py-12">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">This week's VIP deals</h2>
            <p className="text-sm text-gray-500 mt-1">
              {isVipMember
                ? 'Exclusive early-access listings visible to you as a VIP member.'
                : 'Locked preview subscribe to reveal prices, locations and contacts.'}
            </p>
          </div>
          <p className="text-sm font-semibold text-gray-500 self-center">
            {deals.length} exclusive deals · avg {avgDiscount}% below market
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {deals.map((deal) => (
              <VipDealCard
                key={deal.id}
                listing={deal}
                isVipMember={isVipMember}
                onJoin={handleJoin}
              />
            ))}
          </div>
        )}

        {/* How it works footnote */}
        <div className="mt-10 text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-200">
          <strong>How it works:</strong> a blocker ticks "VIP exclusive" when posting → admin
          approves → listing is visible only to active VIP subscribers for 7 days → then it moves
          to the public site (unless sold). VIP deals count double in the monthly Lotto.
        </div>
      </section>
    </div>
  );
};
