"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ConfirmDialog } from "./confirm-dialog";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
};

type Ctx = (opts: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<Ctx | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<(v: boolean) => void>(() => () => {});

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o);
    setOpen(true);
    return new Promise<boolean>((resolve) => setResolver(() => resolve));
  }, []);

  const onConfirm = useCallback(() => {
    resolver(true);
  }, [resolver]);

  const onOpenChange = useCallback((v: boolean) => {
    setOpen(v);
    if (!v) resolver(false); // user closed => reject/false
  }, [resolver]);

  const ctx = useMemo<Ctx>(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={ctx}>
      {children}
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title={opts.title}
        description={opts.description}
        confirmText={opts.confirmText ?? "Confirm"}
        cancelText={opts.cancelText ?? "Cancel"}
        variant={opts.variant ?? "default"}
        onConfirm={onConfirm}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}
