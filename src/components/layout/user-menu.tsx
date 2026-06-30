"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { useClickOutside } from "@/hooks/use-click-outside";

interface UserMenuProps {
  name?: string;
  email?: string;
}

export function UserMenu({
  name = "Adebayo Okonkwo",
  email = "admin@greengate.io",
}: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar name={name} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-ink">
            {name}
          </span>
          <span className="block text-xs leading-tight text-ink-subtle">
            {email}
          </span>
        </span>
        <Icons.chevronDown
          className={cn(
            "size-4 text-ink-subtle transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-paper-raised shadow-lg"
        >
          <div className="border-b border-line px-4 py-3 sm:hidden">
            <p className="text-sm font-medium text-ink">{name}</p>
            <p className="truncate text-xs text-ink-subtle">{email}</p>
          </div>
          <div className="p-1">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
            >
              <Icons.user className="size-4" />
              Profile
            </Link>
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
            >
              <Icons.settings className="size-4" />
              Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
