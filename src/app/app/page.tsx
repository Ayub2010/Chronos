import { cookies } from "next/headers";
import { AppGate } from "@/components/auth/app-gate";

export default async function AppPage() {
  const jar = await cookies();
  const demo = jar.get("chronos-demo")?.value === "1";
  return <AppGate demo={demo} />;
}
