import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10.5 w-full rounded-[9px] border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-brand-ink-soft/70 focus-visible:outline-none focus-visible:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-card dark:border-border dark:text-foreground',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
