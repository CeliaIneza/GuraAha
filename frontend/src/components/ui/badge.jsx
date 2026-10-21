import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none select-none tracking-tight',
  {
    variants: {
      variant: {
        default: 'bg-brand-green text-white shadow-xs',
        secondary: 'bg-brand-bg-soft text-brand-green-dark border border-brand-green/20',
        outline: 'border border-brand-line text-brand-ink bg-white',
        destructive: 'bg-red-50 text-red-700 border border-red-200',
        land: 'bg-brand-pale text-brand-green-dark border border-brand-green/20',
        house: 'bg-amber-50 text-amber-900 border border-amber-200',
        plot: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        vip: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
