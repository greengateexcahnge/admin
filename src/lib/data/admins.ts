/** Mirrors admin.admins (Database.md / InitAdmin migration). */

export type AdminRole =
  | "super_admin" | "admin" | "support"
  | "compliance" | "finance" | "read_only";

export type AdminStatus = "active" | "suspended" | "disabled";

export interface AdminMember {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: AdminStatus;
  failedLoginCount: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ADMIN_ROLES: AdminRole[] = [
  "super_admin", "admin", "support", "compliance", "finance", "read_only",
];

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
  compliance: "Compliance",
  finance: "Finance",
  read_only: "Read Only",
};

export const STATUS_LABELS: Record<AdminStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  disabled: "Disabled",
};

function d(daysAgo: number, hoursAgo = 0): string {
  const dt = new Date("2026-06-27T10:00:00Z");
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(dt.getHours() - hoursAgo);
  return dt.toISOString();
}

const SEED: AdminMember[] = [
  {
    id: "adm-001",
    email: "victor.okonkwo@greengate.ng",
    name: "Victor Okonkwo",
    role: "super_admin",
    status: "active",
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: d(0, 2),
    createdBy: null,
    createdAt: d(365),
    updatedAt: d(0, 2),
  },
  {
    id: "adm-002",
    email: "amara.osei@greengate.ng",
    name: "Amara Osei",
    role: "admin",
    status: "active",
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: d(0, 5),
    createdBy: "adm-001",
    createdAt: d(300),
    updatedAt: d(1),
  },
  {
    id: "adm-003",
    email: "taiwo.adeleke@greengate.ng",
    name: "Taiwo Adeleke",
    role: "admin",
    status: "active",
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: d(2),
    createdBy: "adm-001",
    createdAt: d(280),
    updatedAt: d(2),
  },
  {
    id: "adm-004",
    email: "blessing.eze@greengate.ng",
    name: "Blessing Eze",
    role: "support",
    status: "active",
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: d(0, 1),
    createdBy: "adm-002",
    createdAt: d(180),
    updatedAt: d(0, 1),
  },
  {
    id: "adm-005",
    email: "kehinde.olawale@greengate.ng",
    name: "Kehinde Olawale",
    role: "support",
    status: "active",
    failedLoginCount: 1,
    lockedUntil: null,
    lastLoginAt: d(1),
    createdBy: "adm-002",
    createdAt: d(160),
    updatedAt: d(1),
  },
  {
    id: "adm-006",
    email: "chidi.okeke@greengate.ng",
    name: "Chidi Okeke",
    role: "compliance",
    status: "active",
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: d(3),
    createdBy: "adm-001",
    createdAt: d(240),
    updatedAt: d(3),
  },
  {
    id: "adm-007",
    email: "ngozi.nwachukwu@greengate.ng",
    name: "Ngozi Nwachukwu",
    role: "finance",
    status: "active",
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: d(1),
    createdBy: "adm-001",
    createdAt: d(200),
    updatedAt: d(1),
  },
  {
    id: "adm-008",
    email: "seun.bakare@greengate.ng",
    name: "Seun Bakare",
    role: "read_only",
    status: "active",
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: d(7),
    createdBy: "adm-002",
    createdAt: d(90),
    updatedAt: d(7),
  },
  {
    id: "adm-009",
    email: "emeka.obiora@greengate.ng",
    name: "Emeka Obiora",
    role: "support",
    status: "suspended",
    failedLoginCount: 3,
    lockedUntil: null,
    lastLoginAt: d(14),
    createdBy: "adm-002",
    createdAt: d(120),
    updatedAt: d(5),
  },
  {
    id: "adm-010",
    email: "funke.adeyemi@greengate.ng",
    name: "Funke Adeyemi",
    role: "read_only",
    status: "disabled",
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: d(60),
    createdBy: "adm-001",
    createdAt: d(210),
    updatedAt: d(30),
  },
];

const _store: AdminMember[] = [...SEED];
let _counter = SEED.length + 1;

export function getAdmins(): AdminMember[] {
  return _store.filter(a => true);
}

export function nextAdminId(): string {
  return `adm-${String(_counter++).padStart(3, "0")}`;
}

export interface AdminSummary {
  total: number;
  byStatus: Record<AdminStatus, number>;
  byRole: Record<AdminRole, number>;
}

export function getAdminSummary(admins: AdminMember[]): AdminSummary {
  const byStatus: Record<AdminStatus, number> = { active: 0, suspended: 0, disabled: 0 };
  const byRole: Record<AdminRole, number> = {
    super_admin: 0, admin: 0, support: 0, compliance: 0, finance: 0, read_only: 0,
  };
  for (const a of admins) {
    byStatus[a.status]++;
    byRole[a.role]++;
  }
  return { total: admins.length, byStatus, byRole };
}
