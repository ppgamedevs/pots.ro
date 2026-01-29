"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function Modal({ open, onOpenChange, title, children }: { 
  open: boolean; 
  onOpenChange: unknown; 
  title?: string; 
  children: React.ReactNode; 
}) {
  const onOpenChangeFn: (v: boolean) => void =
    typeof onOpenChange === 'function' ? (onOpenChange as (v: boolean) => void) : () => {};
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChangeFn}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Fereastră modală"
                className="fixed left-1/2 top-1/2 z-[60] w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2
                           rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-soft"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  {title ? <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</Dialog.Title> : <span />}
                  <Dialog.Close className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </Dialog.Close>
                </div>
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
