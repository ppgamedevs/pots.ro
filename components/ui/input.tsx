import * as React from "react";
import clsx from "clsx";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60",
        "px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-slate-950",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
