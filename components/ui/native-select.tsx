import * as React from "react";
import clsx from "clsx";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function Select({ className, options, ...props }: SelectProps) {
  return (
    <select
      className={clsx(
        "h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60",
        "px-3 pr-8 text-sm text-slate-900 dark:text-slate-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-slate-950",
        "appearance-none bg-[right_0.75rem_center] bg-no-repeat",
        "[background-image:linear-gradient(45deg,transparent_50%,currentColor_50%),linear-gradient(135deg,currentColor_50%,transparent_50%),linear-gradient(to_right,transparent,transparent)]",
        "[background-size:6px_6px,6px_6px,1.5em_1.5em]",
        "[background-position:calc(100%-14px)_50%,calc(100%-8px)_50%,calc(100%-2.1em)_50%]",
        className
      )}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
