import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import React from "react";
import clsx from "clsx";

export type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: string | React.ReactNode;
  confirmText?: string;    // ex: "Delete"
  cancelText?: string;     // ex: "Cancel"
  variant?: "danger" | "destructive" | "default";
  loading?: boolean;
  onConfirm: unknown;
  onOpenChange: unknown;
};

export function ConfirmDialog({
  open,
  title = "Confirm action",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  const onConfirmFn = typeof onConfirm === 'function' ? (onConfirm as () => Promise<void> | void) : undefined;
  const onOpenChangeFn = typeof onOpenChange === 'function' ? (onOpenChange as (v: boolean) => void) : undefined;
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading || internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirmFn?.();
      onOpenChangeFn?.(false);
    } finally {
      setInternalLoading(false);
    }
  };

  const confirmBtnClass = clsx(
    "inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm font-medium transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-slate-950",
    variant === "danger" || variant === "destructive"
      ? "bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
      : "bg-brand text-white hover:bg-brand-dark disabled:opacity-60"
  );

  return (
    <Dialog.Root open={open} onOpenChange={(v) => onOpenChangeFn?.(v)}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Confirmare"
                className="fixed left-1/2 top-1/2 z-[60] w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2
                           rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-soft"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    "mt-1 rounded-lg p-2",
                    variant === "danger" ? "bg-red-50 dark:bg-red-500/10 text-red-600" : "bg-slate-100 dark:bg-white/10 text-slate-700"
                  )}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-white/10">
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <Dialog.Close asChild>
                    <button
                      className="h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10
                                 bg-white dark:bg-slate-900/60 text-sm hover:shadow-soft"
                      disabled={isLoading}
                    >
                      {cancelText}
                    </button>
                  </Dialog.Close>

                  <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className={confirmBtnClass}
                  >
                    {isLoading ? "Please wait…" : confirmText}
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
