import type { Metadata } from "next";
import { getUsers } from "@/lib/data/users";
import { UsersManager } from "@/components/users/users-manager";

export const metadata: Metadata = {
  title: "Users",
};

export default function UsersPage() {
  const users = getUsers();
  return <UsersManager initialUsers={users} />;
}
