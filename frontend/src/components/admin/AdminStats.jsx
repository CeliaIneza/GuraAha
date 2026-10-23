import React from "react";

// cards: [{ id, label, value, sub, icon }]  (id = tab the card jumps to)
export const AdminStats = ({ cards, activeTab, onSelect, loading }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
    {cards.map((card) => {
      const Icon = card.icon;
      const isActive = activeTab === card.id;
      return (
        <button
          key={card.label}
          type="button"
          onClick={() => onSelect(card.id)}
          className={`bg-white border rounded-[9px] p-4 text-left shadow-xs transition-all hover:shadow-md cursor-pointer ${
            isActive
              ? "border-brand-green ring-2 ring-brand-green/20"
              : "border-brand-line hover:border-brand-green/50"
          }`}
        >
          <div className="w-8 h-8 rounded-[7px] bg-brand-bg-soft flex items-center justify-center text-brand-green mb-2">
            <Icon className="w-4 h-4" />
          </div>
          <b className="text-2xl font-extrabold text-brand-ink block leading-none">
            {loading ? "…" : card.value}
          </b>
          <span className="text-xs font-semibold text-brand-ink block mt-1.5">
            {card.label}
          </span>
          <span className="text-xs text-brand-ink-soft">{card.sub}</span>
        </button>
      );
    })}
  </div>
);