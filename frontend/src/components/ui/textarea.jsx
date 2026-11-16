import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "flex w-full min-h-[72px] rounded-[9px] border border-brand-line bg-white px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-ink-soft outline-none transition-all hover:border-brand-green/70 focus-visible:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };