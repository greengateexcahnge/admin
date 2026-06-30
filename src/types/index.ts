import type { Icon } from "@/components/icons";

/** A single navigation entry for sidebars, menus, breadcrumbs, etc. */
export interface NavItem {
  title: string;
  href: string;
  icon?: Icon;
  disabled?: boolean;
  external?: boolean;
}

/** Generic API envelope for typed responses. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
