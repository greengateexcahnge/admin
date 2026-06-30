import * as React from "react";
import { cn } from "@/lib/utils";
import type { Icon } from "@/components/icons";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional leading icon rendered inside the field. */
  icon?: Icon;
  /** Optional element rendered at the trailing edge (e.g. a toggle button). */
  trailing?: React.ReactNode;
  /** Marks the field as invalid for styling + a11y. */
  invalid?: boolean;
}

/** Text input wired to the project's paper/charcoal theme. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon: LeadingIcon, trailing, invalid, ...props }, ref) => {
    return (
      <div className="relative">
        {LeadingIcon ? (
          <LeadingIcon
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
          />
        ) : null}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-11 w-full rounded-md border bg-paper-raised text-sm text-ink",
            "placeholder:text-ink-subtle",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised",
            "disabled:cursor-not-allowed disabled:opacity-50",
            LeadingIcon ? "pl-9" : "pl-3",
            trailing ? "pr-11" : "pr-3",
            invalid
              ? "border-danger focus-visible:ring-danger"
              : "border-line-strong",
            className,
          )}
          {...props}
        />
        {trailing ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {trailing}
          </div>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
