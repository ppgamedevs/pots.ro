"use client";
import * as Tabs from "@radix-ui/react-tabs";
import clsx from "clsx";
import * as React from "react";
import { cn } from "@/lib/utils";

const TabsRoot = React.forwardRef<
  React.ElementRef<typeof Tabs.Root>,
  React.ComponentPropsWithoutRef<typeof Tabs.Root>
>(({ className, ...props }, ref) => (
  <Tabs.Root ref={ref} className={cn("w-full", className)} {...props} />
));
TabsRoot.displayName = "Tabs";

const TabsList = React.forwardRef<
  React.ElementRef<typeof Tabs.List>,
  React.ComponentPropsWithoutRef<typeof Tabs.List>
>(({ className, ...props }, ref) => (
  <Tabs.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = Tabs.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof Tabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof Tabs.Trigger>
>(({ className, ...props }, ref) => (
  <Tabs.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = Tabs.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof Tabs.Content>,
  React.ComponentPropsWithoutRef<typeof Tabs.Content>
>(({ className, ...props }, ref) => (
  <Tabs.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = Tabs.Content.displayName;

export { TabsRoot as Tabs, TabsList, TabsTrigger, TabsContent };

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