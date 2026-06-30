"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icons, type Icon } from "@/components/icons";

type DialogTone = "neutral" | "danger" | "warning";

const toneClasses: Record<DialogTone, string> = {
  neutral: "bg-paper-sunken text-ink",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/15 text-warning",
};

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: Icon;
  tone?: DialogTone;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

/** Centered modal dialog with backdrop, Escape-to-close and scroll lock. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  icon: LeadingIcon,
  tone = "neutral",
  children,
  footer,
}: DialogProps) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        open ? "" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full max-w-md rounded-xl border border-line bg-paper-raised p-6 shadow-xl transition-all duration-200",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        <div className="flex items-start gap-4">
          {LeadingIcon ? (
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-full",
                toneClasses[tone],
              )}
            >
              <LeadingIcon className="size-5" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-ink-muted">{description}</p>
            ) : null}
            {children ? <div className="mt-3">{children}</div> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"
          >
            <Icons.close className="size-5" />
          </button>
        </div>
        {footer ? (
          <div className="mt-6 flex justify-end gap-2">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
