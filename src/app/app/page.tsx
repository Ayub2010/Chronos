import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TrackerApp } from "@/components/tracker/tracker-app";
import { createClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const jar = await cookies();
  const demo = jar.get("chronos-demo")?.value === "1";
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return <TrackerApp email={user.email ?? null} demo={false} />;
    }
  }

  if (demo) {
    return <TrackerApp email={null} demo />;
  }

  redirect("/auth");
}
