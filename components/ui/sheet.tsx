"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

export type SheetProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
  side?: "right" | "left" | "bottom"; // desktop default: right
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode; // buttons row
};

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  className,
  children,
  footer,
}: SheetProps) {
  // detect mobile for bottom sheet by default
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const actualSide = isMobile ? "bottom" : side;

  const posClasses =
    actualSide === "right"
      ? "right-0 top-0 h-full w-[92vw] max-w-md"
      : actualSide === "left"
      ? "left-0 top-0 h-full w-[92vw] max-w-md"
      : "left-1/2 -translate-x-1/2 bottom-0 w-full max-w-lg"; // bottom

  const motionFrom =
    actualSide === "right"
      ? { x: 24, y: 0 }
      : actualSide === "left"
      ? { x: -24, y: 0 }
      : { x: 0, y: 24 };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Panou lateral"
                className={clsx(
                  "fixed z-[60] rounded-t-2xl md:rounded-none border border-slate-200 dark:border-white/10",
                  "bg-white dark:bg-slate-900 shadow-soft flex flex-col",
                  posClasses,
                  className
                )}
                initial={{ opacity: 0, ...motionFrom, scale: actualSide === "bottom" ? 0.995 : 1 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, ...motionFrom, scale: actualSide === "bottom" ? 0.995 : 1 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200 dark:border-white/10">
                  <div className="space-y-0.5">
                    {title && <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>}
                    {description && (
                      <Dialog.Description className="text-xs text-slate-600 dark:text-slate-300">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close
                    className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-white/10"
                    aria-label="Închide"
                  >
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                </div>

                {/* Body (scrollable) */}
                <div className="flex-1 overflow-auto p-4">{children}</div>

                {/* Footer */}
                {footer && (
                  <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                    <div className="flex items-center justify-end gap-2">{footer}</div>
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
