import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, orientation = "horizontal", ...props }, ref) => {
  const values = props.value || props.defaultValue || [0];
  
  return (
    <SliderPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn(
        "relative flex touch-none select-none items-center",
        orientation === "horizontal" ? "w-full h-1.5" : "flex-col h-full w-1.5",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className={cn(
        "relative grow overflow-hidden rounded-full bg-white/10",
        orientation === "horizontal" ? "h-full w-full" : "w-full h-full"
      )}>
        <SliderPrimitive.Range className={cn(
          "absolute bg-white",
          orientation === "horizontal" ? "h-full" : "w-full"
        )} />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb 
          key={i} 
          className="block h-5 w-5 rounded-full border border-white/20 bg-white shadow-xl ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" 
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
