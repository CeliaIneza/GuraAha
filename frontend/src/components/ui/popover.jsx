import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

const join = (...c) => c.filter(Boolean).join(" ");

function Popover(props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ className, ...props }) {
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      className={className}
      {...props}
    />
  );
}

function PopoverContent({
  className,
  align = "end",
  side = "bottom",
  sideOffset = 6,
  children,
  ...props
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={join(
            "min-w-40 rounded-[9px] border border-brand-line bg-white p-1 shadow-lg outline-none",
            "origin-(--transform-origin) transition-[opacity,transform] duration-100",
            "data-starting-style:opacity-0 data-starting-style:scale-95",
            "data-ending-style:opacity-0 data-ending-style:scale-95",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };