"use client";
import * as Tabs from "@radix-ui/react-tabs";
import clsx from "clsx";

export function UITabs({
  defaultValue,
  tabs,
  className,
}: {
  defaultValue: string;
  tabs: { value: string; label: string; content: React.ReactNode }[];
  className?: string;
}) {
  return (
    <Tabs.Root defaultValue={defaultValue} className={clsx("w-full", className)}>
      <Tabs.List
        aria-label="Tabs"
        className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 p-1"
      >
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.value}
            value={t.value}
            className={clsx(
              "px-3 h-8 rounded-lg text-sm transition-all duration-200",
              "data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-300",
              "data-[state=inactive]:hover:text-slate-900 dark:data-[state=inactive]:hover:text-slate-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
            )}
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {tabs.map((t) => (
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