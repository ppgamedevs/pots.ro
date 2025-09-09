import * as React from "react";
import clsx from "clsx";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={clsx(
        "w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60",
        "px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-slate-950",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
