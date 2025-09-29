"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Check, Eye, EyeOff, Pencil, Trash } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export type RowActionsProps = {
  onEdit?: () => void;
  onPublish?: () => Promise<void> | void;
  onUnpublish?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  published?: boolean;
  size?: "sm" | "md";
};

export function RowActions({ onEdit, onPublish, onUnpublish, onDelete, published, size = "md" }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const btnSize = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  const itemClass =
    "px-2.5 py-1.5 text-sm rounded-md outline-none cursor-pointer " +
    "hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 " +
    "text-slate-800 dark:text-slate-100 flex items-center gap-2";

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Row actions"
          className={clsx(
            "inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10",
            "bg-white dark:bg-slate-900/60 hover:shadow-soft transition",
            btnSize
          )}
        >
          <DotsHorizontalIcon />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="bottom"
          align="end"
          className="z-[70] min-w-[180px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 p-1 shadow-soft backdrop-blur"
        >
          {onEdit && (
            <DropdownMenu.Item className={itemClass} onSelect={onEdit}>
              <Pencil className="h-4 w-4" /> Edit
            </DropdownMenu.Item>
          )}

          {published ? (
            onUnpublish && (
              <DropdownMenu.Item className={itemClass} onSelect={async () => { await onUnpublish(); }}>
                <EyeOff className="h-4 w-4" /> Unpublish
              </DropdownMenu.Item>
            )
          ) : (
            onPublish && (
              <DropdownMenu.Item className={itemClass} onSelect={async () => { await onPublish(); }}>
                <Eye className="h-4 w-4" /> Publish
              </DropdownMenu.Item>
            )
          )}

          {onDelete && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-white/10" />
              <DropdownMenu.Item
                className={clsx(itemClass, "text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10")}
                onSelect={async () => { await onDelete(); }}
              >
                <Trash className="h-4 w-4" /> Delete
              </DropdownMenu.Item>
            </>
          )}

          <DropdownMenu.Arrow className="fill-white dark:fill-slate-900/90" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
