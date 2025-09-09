"use client";
import * as Tabs from "@radix-ui/react-tabs";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";

type TabItem = {
  value: string;
  label: string;
  count?: number;
  countVariant?: "neutral" | "success" | "warning" | "danger" | "brand";
  content: React.ReactNode;
};

export function DashboardTabs({
  defaultValue,
  tabs,
  className,
}: {
  defaultValue: string;
  tabs: TabItem[];
  className?: string;
}) {
  return (
    <Tabs.Root defaultValue={defaultValue} className={clsx("w-full", className)}>
      <Tabs.List
        className="flex flex-wrap gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 p-1"
        aria-label="Dashboard tabs"
      >
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.value}
            value={t.value}
            className={clsx(
              "h-9 px-3 rounded-lg text-sm transition-all duration-200 inline-flex items-center gap-2",
              "data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-300",
              "data-[state=inactive]:hover:text-slate-900 dark:data-[state=inactive]:hover:text-slate-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
            )}
          >
            <span>{t.label}</span>
            {typeof t.count === "number" && (
              <Badge
                variant={t.countVariant ?? "neutral"}
                className={clsx(
                  "h-6",
                  // nicer on active
                  "data-[state=active]:bg-white/20 data-[state=active]:text-white"
                )}
              >
                {t.count}
              </Badge>
            )}
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
