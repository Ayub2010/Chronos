import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Brand } from "@/components/brand";
import { AuthActions } from "@/components/auth/auth-actions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const jar = await cookies();
  if (jar.get("chronos-demo")?.value === "1") {
    redirect("/app");
  }

  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) redirect("/app");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 grid-fine opacity-30" />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[0_0_80px_-40px_rgba(34,211,238,0.7)]">
        <Brand />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          Sign in to Chronos
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Continue with Google to sync your 48-block audits across devices.
          Your row is locked to your account with RLS.
        </p>
        {params.error ? (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
            Google sign-in did not complete. Check your Supabase OAuth
            configuration and try again.
          </p>
        ) : null}
        <AuthActions configured={isSupabaseConfigured()} />
        <p className="mt-6 text-center text-xs text-muted">
          By continuing you agree to keep audits honest — future dates stay
          locked.{" "}
          <Link href="/" className="text-foreground underline-offset-2 hover:underline">
            Back home
          </Link>
        </p>
      </div>
    </div>
  );
}
