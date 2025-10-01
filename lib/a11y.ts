import { cn } from "@/lib/utils";

export const visuallyHidden = cn(
  "absolute",
  "w-px",
  "h-px",
  "p-0",
  "-m-px",
  "overflow-hidden",
  "whitespace-nowrap",
  "border-0",
  "clip-path-inset-50"
);

export const focusRing = cn(
  "focus:outline-none",
  "focus:ring-2",
  "focus:ring-blue-500",
  "focus:ring-offset-2"
);

export const accessibleButton = cn(
  "inline-flex",
  "items-center",
  "justify-center",
  "rounded-md",
  "text-sm",
  "font-medium",
  "transition-colors",
  "focus:outline-none",
  "focus:ring-2",
  "focus:ring-blue-500",
  "focus:ring-offset-2",
  "disabled:opacity-50",
  "disabled:pointer-events-none"
);

export const accessibleInput = cn(
  "flex",
  "h-10",
  "w-full",
  "rounded-md",
  "border",
  "border-gray-300",
  "bg-white",
  "px-3",
  "py-2",
  "text-sm",
  "placeholder:text-gray-500",
  "focus:outline-none",
  "focus:ring-2",
  "focus:ring-blue-500",
  "focus:border-blue-500",
  "disabled:cursor-not-allowed",
  "disabled:opacity-50"
);

export const accessibleTable = cn(
  "w-full",
  "border-collapse",
  "border",
  "border-gray-200",
  "rounded-lg",
  "overflow-hidden"
);

export const accessibleTableHeader = cn(
  "bg-gray-50",
  "px-4",
  "py-3",
  "text-left",
  "text-xs",
  "font-medium",
  "text-gray-500",
  "uppercase",
  "tracking-wider",
  "border-b",
  "border-gray-200"
);

export const accessibleTableRow = cn(
  "border-b",
  "border-gray-200",
  "hover:bg-gray-50",
  "transition-colors"
);

export const accessibleTableCell = cn(
  "px-4",
  "py-3",
  "text-sm",
  "text-gray-900"
);
