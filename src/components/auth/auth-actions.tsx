"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function AuthActions({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/app");
    });
  }, [router]);

  const signInGoogle = async () => {
    setMessage(null);
    const auth = getFirebaseAuth();
    if (!auth) {
      setMessage("Add the NEXT_PUBLIC_FIREBASE_* variables to enable Google.");
      return;
    }
    setPending(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.replace("/app");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Google sign-in failed.",
      );
      setPending(false);
    }
  };

  return (
    <div className="mt-8 space-y-3">
      <button
        type="button"
        onClick={signInGoogle}
        disabled={pending || !configured}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface text-sm font-medium transition-colors hover:border-zinc-500 disabled:opacity-40"
      >
        <GoogleMark />
        Continue with Google
      </button>
      {!configured ? (
        <p className="text-xs leading-5 text-muted">
          Google sign-in needs a Firebase project. Add the{" "}
          <span className="font-mono text-foreground">
            NEXT_PUBLIC_FIREBASE_*
          </span>{" "}
          variables to <span className="font-mono">.env.local</span>, enable
          Google under Authentication → Sign-in method, and authorize
          localhost.
        </p>
      ) : null}
      {message ? <p className="text-xs text-red-300">{message}</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.41 5.41 0 0 1 3.69 9c0-.6.1-1.18.26-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
