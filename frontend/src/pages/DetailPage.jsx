import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { IMG, XTRA } from '../data/mockData';
import { Lock, Unlock, Phone, MessageSquare, ChevronRight, CheckCircle2 } from 'lucide-react';

export const DetailPage = () => {
  const { id } = useParams();
  const { listings, unlockedContacts, openMoMo, settings } = useApp();

  const listingId = parseInt(id, 10);
  const listing = listings.find((l) => l.id === listingId);

  const [selectedImg, setSelectedImg] = useState(listing ? IMG[listing.id] : '');

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-brand-ink mb-4">Property not found</h2>
        <Link to="/browse" className="text-brand-green font-semibold hover:underline">
          ← Return to Browse
        </Link>
      </div>
    );
  }

  const galleryImages = [IMG[listing.id], ...XTRA];
  const activeImg = selectedImg || IMG[listing.id];

  const listingUnlocks = unlockedContacts[listing.id] || [];
  const isBlockerUnlocked = listingUnlocks.includes('blocker');
  const isOwnerUnlocked = listingUnlocks.includes('owner');

  const formattedPrice = `${listing.price.toLocaleString('en-US')} RWF`;

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 min-h-screen">
      {/* BREADCRUMB */}
      <div className="text-xs sm:text-sm text-brand-ink-soft mb-6 flex items-center gap-1.5 flex-wrap">
        <Link to="/" className="hover:underline">Rwanda</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span>{listing.prov}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span>{listing.dist}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span>{listing.sect}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span>{listing.cell}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <b className="text-brand-green-dark">{listing.vill}</b>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* LEFT CONTENT */}
        <div className="md:col-span-3">
          {/* MAIN GALLERY DISPLAY */}
          <div
            className="w-full h-80 sm:h-96 rounded-card bg-slate-900 bg-cover bg-center shadow-md transition-all duration-300"
            style={{ backgroundImage: `url('${activeImg}?q=75&auto=format&fit=crop&w=1400')` }}
          />

          {/* THUMBNAILS */}
          <div className="flex gap-3 mt-3">
            {galleryImages.map((url, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImg(url)}
                className={`flex-1 h-20 rounded-xl bg-cover bg-center cursor-pointer transition-all ${
                  activeImg === url ? 'ring-4 ring-brand-green ring-offset-2' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundImage: `url('${url}?q=60&auto=format&fit=crop&w=400')` }}
              />
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink mt-6 mb-4">
            {listing.title}
          </h1>

          {/* SPECIFICATIONS GRID */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-brand-bg-soft rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">Size</span>
              <b className="text-base text-brand-ink">{listing.size}</b>
            </div>
            <div className="bg-brand-bg-soft rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">UPI / Parcel No.</span>
              <b className="text-base text-brand-ink">{listing.upi}</b>
            </div>
            <div className="bg-brand-bg-soft rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">Type</span>
              <b className="text-base text-brand-ink capitalize">{listing.type}</b>
            </div>
            <div className="bg-brand-bg-soft rounded-xl p-3.5 border border-brand-line">
              <span className="text-xs text-brand-ink-soft block mb-0.5">Verified blocker</span>
              <b className="text-base text-brand-ink">{listing.blocker}</b>
            </div>
          </div>

          {/* ABOUT THIS PROPERTY */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-brand-ink mb-2">About this property</h3>
            <p className="text-sm sm:text-base text-brand-ink-soft leading-relaxed">
              {listing.desc}
            </p>
          </div>

          {/* INVESTMENT HIGHLIGHTS */}
          <div className="mt-8 pt-6 border-t border-brand-line">
            <h3 className="text-lg font-bold text-brand-ink mb-2 flex items-center gap-2">
              📍 Area investment highlights
            </h3>
            <p className="text-sm text-brand-ink-soft leading-relaxed">
              Rapid growth corridor: new tarmac road (2025), fibre coverage, 10 min to markets and schools. District development plan zones this cell for residential expansion.
            </p>
            <span className="inline-block mt-2 text-xs bg-brand-bg-soft border border-brand-line text-brand-ink-soft px-3 py-1 rounded-md">
              Editable per District/Sector by admin
            </span>
          </div>
        </div>

        {/* RIGHT CONTACT LOCKBOX CARD */}
        <div className="md:col-span-2">
          <div className="sticky top-24 bg-white border-1.5 border-brand-line rounded-card p-6 shadow-md">
            <div className="text-3xl font-bold text-brand-green-dark mb-6">
              {formattedPrice}
            </div>

            {/* BLOCKER CONTACT LOCKBOX */}
            <div className="mb-4">
              {isBlockerUnlocked ? (
                <div className="bg-[#E4F1EC] border-1.5 border-brand-green rounded-xl p-4">
                  <div className="flex items-center gap-2 font-bold text-sm text-brand-green-dark mb-1">
                    <Unlock className="w-4 h-4" />
                    Blocker (agent) contact
                  </div>
                  <div className="text-xl font-bold text-brand-ink tracking-wide my-1">
                    {listing.blockerPhone}
                  </div>
                  <div className="text-xs text-brand-ink-soft mt-1">
                    {listing.blocker} · Verified Agent
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a
                      href={`tel:${listing.blockerPhone}`}
                      className="flex-1 py-2 bg-brand-green text-white text-center text-xs font-semibold rounded-lg hover:bg-brand-green-dark transition-colors flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    <a
                      href={`https://wa.me/${listing.blockerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 bg-emerald-700 text-white text-center text-xs font-semibold rounded-lg hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-brand-bg-soft border border-brand-line rounded-xl p-4">
                  <h4 className="font-bold text-sm text-brand-ink flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-brand-green" />
                    Blocker (agent) contact
                  </h4>
                  <p className="text-xs text-brand-ink-soft mb-3">
                    Talk to the verified local agent managing this property.
                  </p>
                  <button
                    onClick={() => openMoMo({
                      kind: 'blocker',
                      listingId: listing.id,
                      amount: settings.blockerUnlockFee,
                      title: listing.title
                    })}
                    className="w-full py-2.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
                  >
                    Unlock for {settings.blockerUnlockFee} RWF
                  </button>
                </div>
              )}
            </div>

            {/* OWNER CONTACT LOCKBOX */}
            <div className="mb-6">
              {isOwnerUnlocked ? (
                <div className="bg-[#E4F1EC] border-1.5 border-brand-green rounded-xl p-4">
                  <div className="flex items-center gap-2 font-bold text-sm text-brand-green-dark mb-1">
                    <Unlock className="w-4 h-4" />
                    Owner contact
                  </div>
                  <div className="text-xl font-bold text-brand-ink tracking-wide my-1">
                    {listing.ownerPhone}
                  </div>
                  <div className="text-xs text-brand-ink-soft mt-1">
                    Property Owner · Verified by GuraAha
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a
                      href={`tel:${listing.ownerPhone}`}
                      className="flex-1 py-2 bg-brand-earth text-white text-center text-xs font-semibold rounded-lg hover:bg-amber-800 transition-colors flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    <a
                      href={`https://wa.me/${listing.ownerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 bg-emerald-700 text-white text-center text-xs font-semibold rounded-lg hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-brand-bg-soft border border-brand-line rounded-xl p-4">
                  <h4 className="font-bold text-sm text-brand-ink flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-brand-earth" />
                    Owner contact
                  </h4>
                  <p className="text-xs text-brand-ink-soft mb-3">
                    Deal directly with the property owner.
                  </p>
                  <button
                    onClick={() => openMoMo({
                      kind: 'owner',
                      listingId: listing.id,
                      amount: settings.ownerUnlockFee,
                      title: listing.title
                    })}
                    className="w-full py-2.5 bg-brand-earth hover:bg-amber-800 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
                  >
                    Unlock for {settings.ownerUnlockFee} RWF
                  </button>
                </div>
              )}
            </div>

            <div className="text-xs text-brand-ink-soft bg-brand-bg-soft p-3 rounded-lg border border-brand-line leading-relaxed">
              One payment = permanent unlock for this listing + 1 free Lotto entry. Powered by MTN MoMo &amp; Airtel Money.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
