"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { navItems } from "@/config/nav";
import { siteConfig } from "@/config/site";

interface SidebarContentProps {
  collapsed: boolean;
  /** Rendered inside the mobile drawer (shows a close button, never collapsed). */
  mobile?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

function SidebarContent({
  collapsed,
  mobile = false,
  onToggleCollapse,
  onCloseMobile,
}: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b border-line px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          {siteConfig.name.charAt(0)}
        </span>
        {!collapsed && (
          <span className="truncate text-base font-semibold text-ink">
            {siteConfig.name}
          </span>
        )}
        {mobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="ml-auto grid size-9 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"
          >
            <Icons.close className="size-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.title : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-paper-sunken font-medium text-ink"
                  : "text-ink-muted hover:bg-paper-sunken hover:text-ink",
              )}
            >
              {Icon && <Icon className="size-5 shrink-0" />}
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!mobile && (
        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <Icons.panelLeft className="size-5 shrink-0" />
            ) : (
              <Icons.panelLeftClose className="size-5 shrink-0" />
            )}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — static, collapsible. Max width well under 300px. */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-line bg-paper-raised transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        <div className="sticky top-0 h-dvh">
          <SidebarContent
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
          />
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          onClick={onCloseMobile}
          className={cn(
            "absolute inset-0 bg-ink/40 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        {/* Panel */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={cn(
            "absolute left-0 top-0 h-full w-[260px] max-w-[80%] border-r border-line bg-paper-raised shadow-xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarContent collapsed={false} mobile onCloseMobile={onCloseMobile} />
        </aside>
      </div>
    </>
  );
}
