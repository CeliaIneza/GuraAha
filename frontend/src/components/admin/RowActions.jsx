import React, { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { MoreVertical } from "lucide-react";

export const RowActions = ({ actions, label = "Row actions" }) => {
  const [open, setOpen] = useState(false);
  const visible = actions.filter((a) => !a.hidden);
  if (visible.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] border border-transparent text-brand-ink-soft hover:bg-brand-bg-soft hover:border-brand-line hover:text-brand-ink transition-colors cursor-pointer data-popup-open:bg-brand-bg-soft data-popup-open:border-brand-line"
      >
        <MoreVertical className="w-4 h-4" />
      </PopoverTrigger>
      <PopoverContent>
        {visible.map(({ label: text, icon: Icon, onClick, destructive }) => (
          <button
            key={text}
            type="button"
            onClick={() => {
              setOpen(false);
              onClick();
            }}
            className={`w-full flex items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-sm font-medium cursor-pointer transition-colors ${
              destructive
                ? "text-red-600 hover:bg-red-50"
                : "text-brand-ink hover:bg-brand-bg-soft"
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            {text}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};