"use client";
import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider, type FieldValues } from "react-hook-form";

export function useZodForm<TSchema extends z.ZodTypeAny>(schema: TSchema, defaults?: Partial<z.infer<TSchema>>) {
  return useForm({
    resolver: zodResolver(schema as any),
    defaultValues: defaults as any,
    mode: "onTouched",
  });
}

export function RHFProvider({ children, methods }: { children: React.ReactNode; methods: any }) {
  return <FormProvider {...methods}>{children}</FormProvider>;
}

export function Field({ label, error, hint, children }: { label?: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      {label ? <label className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</label> : null}
      {children}
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : hint ? <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}
