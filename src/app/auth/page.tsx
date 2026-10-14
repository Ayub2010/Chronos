import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Brand } from "@/components/brand";
import { AuthActions } from "@/components/auth/auth-actions";
import { isFirebaseConfigured } from "@/lib/firebase/client";

export default async function AuthPage() {
  const jar = await cookies();
  if (jar.get("chronos-demo")?.value === "1") {
    redirect("/app");
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
          Your Firestore document is readable only by your account.
        </p>
        <AuthActions configured={isFirebaseConfigured()} />
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
