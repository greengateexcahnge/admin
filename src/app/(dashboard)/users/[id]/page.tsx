import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUserDetail } from "@/lib/data/user-detail";
import { UserDetailView } from "@/components/users/user-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = getUserDetail(id);
  if (!user) return { title: "User not found" };
  const name = [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") || user.name;
  return { title: name };
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const user = getUserDetail(id);
  if (!user) notFound();
  return <UserDetailView user={user} />;
}
