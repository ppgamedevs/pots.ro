"use client";
import * as Tabs from "@radix-ui/react-tabs";
import clsx from "clsx";

type TabItem = {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
  content: React.ReactNode;
};

export function DashboardTabs({
  defaultValue,
  items,
  className,
}: {
  defaultValue: string;
  items: TabItem[];
  className?: string;
}) {
  return (
    <Tabs.Root defaultValue={defaultValue} className={clsx("w-full", className)}>
      <Tabs.List
        aria-label="Dashboard sections"
        className="flex flex-wrap gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 p-1"
      >
        {items.map((t) => (
          <Tabs.Trigger
            key={t.value}
            value={t.value}
            disabled={t.disabled}
            className={clsx(
              "group relative h-9 rounded-lg px-3 text-sm transition-all duration-200 inline-flex items-center gap-2",
              "data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-300",
              "data-[state=inactive]:hover:text-slate-900 dark:data-[state=inactive]:hover:text-slate-100",
              "disabled:opacity-50 disabled:pointer-events-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
            )}
          >
            <span>{t.label}</span>
            {typeof t.count === "number" && (
              <span
                className={clsx(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                  "group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                )}
              >
                {t.count}
              </span>
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {items.map((t) => (
        <Tabs.Content
          key={t.value}
          value={t.value}
          className="mt-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-4"
        >
          {t.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
