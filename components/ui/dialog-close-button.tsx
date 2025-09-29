"use client";
import * as Dialog from "@radix-ui/react-dialog";

export function DialogCloseButton({ children = "Închide" }: { children?: React.ReactNode }) {
  return (
    <Dialog.Close asChild>
      <button className="h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-sm hover:shadow-soft">
        {children}
      </button>
    </Dialog.Close>
  );
}
