import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { MrVisitsMapLoader } from "./MrVisitsMapLoader";

export default async function MrMapsPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const isManagerOrAdmin = auth.profile.role === "MANAGER" || auth.profile.role === "ADMIN";
  if (!isManagerOrAdmin) {
    redirect("/mr/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Maps
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          All field visits with GPS. Click a marker to see visit details and open the full report.
        </p>
      </div>
      <MrVisitsMapLoader />
    </div>
  );
}
