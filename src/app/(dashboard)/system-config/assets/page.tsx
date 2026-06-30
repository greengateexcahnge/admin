import type { Metadata } from "next";
import { getAssets } from "@/lib/data/assets";
import { AssetsManager } from "@/components/assets/assets-manager";

export const metadata: Metadata = {
  title: "Assets — System Config",
};

export default function AssetsPage() {
  const assets = getAssets();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/system-config" className="hover:text-ink">System Config</a>
        <span>/</span>
        <span className="text-ink">Assets</span>
      </div>
      <AssetsManager initialAssets={assets} />
    </div>
  );
}
