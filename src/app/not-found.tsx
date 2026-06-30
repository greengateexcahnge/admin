import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-5xl font-semibold text-ink">404</p>
      <p className="text-ink-muted">This page could not be found.</p>
      <Link
        href="/"
        className="text-sm font-medium text-ink underline underline-offset-4"
      >
        Back to home
      </Link>
    </main>
  );
}
