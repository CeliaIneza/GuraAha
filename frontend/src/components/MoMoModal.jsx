import React from 'react';
import { useApp } from '../context/AppContext';
import { Smartphone, X } from 'lucide-react';

export const MoMoModal = () => {
  const { momoModal, closeMoMo } = useApp();

  if (!momoModal.isOpen) return null;

  const isPlan = momoModal.kind?.startsWith('plan-');
  const planName = isPlan ? momoModal.kind.replace('plan-', '') : null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
        <button
          onClick={closeMoMo}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-brand-green">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-brand-ink">
              {isPlan ? `${planName} membership` : `Unlock ${momoModal.kind === 'blocker' ? 'blocker' : 'owner'} contact`}
            </h3>
            <p className="text-sm font-semibold text-brand-green-dark">
              {Number(momoModal.amount || 0).toLocaleString()} RWF
            </p>
          </div>
        </div>

        <p className="text-sm text-brand-ink-soft leading-relaxed mb-6">
          Mobile money payments, contact unlocks, and memberships are not live in this build yet.
          Listing browse, accounts, blocker applications, and admin review are connected to the API.
        </p>

        <button
          onClick={closeMoMo}
          className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-semibold rounded-xl"
        >
          Close
        </button>
      </div>
    </div>
  );
};
