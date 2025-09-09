import * as React from "react";
import { cn } from "@/lib/utils";

export interface LayoutStableProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: string;
  aspectRatio?: string;
}

const LayoutStable = React.forwardRef<HTMLDivElement, LayoutStableProps>(
  ({ children, className, minHeight = "min-h-0", aspectRatio, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative",
        minHeight,
        aspectRatio,
        className
      )}
      style={{
        contain: "layout style paint",
        ...(aspectRatio && { aspectRatio }),
      }}
      {...props}
    >
      {children}
    </div>
  )
);
LayoutStable.displayName = "LayoutStable";

export interface AspectRatioProps {
  children: React.ReactNode;
  ratio?: number;
  className?: string;
}

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ children, ratio = 1, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      style={{ aspectRatio: ratio.toString() }}
      {...props}
    >
      {children}
    </div>
  )
);
AspectRatio.displayName = "AspectRatio";

export { LayoutStable, AspectRatio };
