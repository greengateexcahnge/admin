import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Log in",
  description: `Sign in to ${siteConfig.name}.`,
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-coffee px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-line bg-paper-raised p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {siteConfig.name}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Sign in to your admin account
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
