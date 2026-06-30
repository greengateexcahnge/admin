"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { UserMenu } from "@/components/layout/user-menu";

interface HeaderProps {
  onToggleMobile: () => void;
}

export function Header({ onToggleMobile }: HeaderProps) {
  const router = useRouter();

  function handleLogout() {
    // TODO: clear the session here, then redirect.
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-line bg-paper-raised/80 px-4 backdrop-blur sm:px-6">
      {/* Left: mobile menu toggle + logout */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleMobile}
          aria-label="Open menu"
          className="grid size-9 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink lg:hidden"
        >
          <Icons.menu className="size-5" />
        </button>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <Icons.logout />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>

      {/* Right: user profile dropdown */}
      <UserMenu />
    </header>
  );
}
