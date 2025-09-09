import clsx from "clsx";

export function Badge({
  children,
  className,
  variant = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "neutral" | "success" | "warning" | "danger" | "brand";
}) {
  const palette: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
    danger:  "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
    brand:   "bg-brand/15 text-brand dark:bg-brand/20 dark:text-brand",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 h-6 text-xs font-medium",
        palette[variant],
        className
      )}
    >
      {children}
    </span>
  );
}