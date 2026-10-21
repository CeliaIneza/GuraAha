import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap text-sm font-semibold transition-all duration-150 outline-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand-green text-white border border-brand-green hover:bg-brand-green-dark hover:border-brand-green-dark shadow-sm",
        brand:
          "bg-brand-green text-white border border-brand-green hover:bg-brand-green-dark hover:border-brand-green-dark shadow-sm",
        outline:
          "border border-brand-line bg-white text-brand-ink hover:border-brand-green hover:bg-brand-bg-soft hover:text-brand-green shadow-xs",
        secondary:
          "bg-brand-bg-soft text-brand-ink border border-transparent hover:bg-brand-pale hover:text-brand-green",
        earth:
          "bg-brand-earth text-white border border-brand-earth hover:bg-brand-earth-dark hover:border-brand-earth-dark shadow-sm",
        ghost:
          "text-brand-ink hover:bg-brand-bg-soft hover:text-brand-green",
        destructive:
          "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-destructive/20 dark:text-destructive",
        link:
          "text-brand-green underline-offset-4 hover:underline hover:text-brand-green-dark font-medium p-0 h-auto",
      },
      size: {
        default: "h-9.5 gap-1.5 px-3.5 py-2 text-sm rounded-xl",
        sm: "h-8 gap-1.5 px-2.5 py-1.5 text-xs rounded-lg",
        lg: "h-11 gap-2 px-5 py-2.5 text-base rounded-lg",
        xl: "h-12 gap-2.5 px-6 py-3 text-base rounded-lg font-bold",
        xs: "h-6.5 gap-1 px-2 text-xs rounded-md",
        icon: "size-9.5 rounded-xl p-0",
        "icon-sm": "size-8 rounded-lg p-0",
        "icon-lg": "size-11 rounded-xl p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(function Button(
  {
    className,
    variant = "default",
    size = "default",
    asChild = false,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot : ButtonPrimitive;

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
