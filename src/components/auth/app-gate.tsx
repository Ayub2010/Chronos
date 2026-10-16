"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { TrackerApp } from "@/components/tracker/tracker-app";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function AppGate() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      router.replace("/auth");
      return;
    }
    return onAuthStateChanged(auth, (current) => {
      if (!current) {
        router.replace("/auth");
        return;
      }
      setUser(current);
    });
  }, [router]);

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background font-mono text-xs text-muted">
        Loading…
      </div>
    );
  }

  return <TrackerApp email={user.email ?? null} demo={false} />;
}
