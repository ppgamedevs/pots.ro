import * as React from "react";

export function Checkbox({ checked, onChange, label }: { checked?: boolean; onChange?: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 dark:border-white/20 text-brand focus:ring-brand"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
