import { Icons } from "@/components/icons";
import type { NavItem } from "@/types";

/** Primary sidebar navigation. */
export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: Icons.dashboard },
  { title: "Users", href: "/users", icon: Icons.users },
  { title: "Admins", href: "/admin", icon: Icons.userCog },
  { title: "System Security", href: "/system-security", icon: Icons.shieldAlert },
  { title: "Wallets", href: "/wallets", icon: Icons.wallet },
  { title: "Transactions", href: "/transactions", icon: Icons.receipt },
  { title: "System Config", href: "/system-config", icon: Icons.sliders },
  { title: "Analytics", href: "/analytics", icon: Icons.analytics },
  { title: "Settings", href: "/settings", icon: Icons.settings },
];
