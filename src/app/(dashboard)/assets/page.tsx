import { redirect } from "next/navigation";

/** Redirects to the new location under System Config. */
export default function AssetsRedirect() {
  redirect("/system-config/assets");
}
