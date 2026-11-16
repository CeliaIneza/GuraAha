import React from "react";

// cards: [{ id, label, value, sub, icon }]  (id = tab the card jumps to)
export const AdminStats = ({ cards, onSelect, loading }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
    {cards.map((card) => {
      const Icon = card.icon;
      return (
        <button
          key={card.label}
          type="button"
          onClick={() => onSelect(card.id)}
          className="bg-white border border-brand-line rounded-[9px] p-4 text-left shadow-xs transition-shadow hover:shadow-md cursor-pointer"
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