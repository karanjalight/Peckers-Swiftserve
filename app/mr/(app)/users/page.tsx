import { redirect } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/mr/supabase-server";
import { MrUsersClient } from "./MrUsersClient";

export default async function MrUsersPage() {
  const auth = await requireManagerOrAdmin();
  if (auth.error) redirect("/mr/login");
  if (auth.profile.role !== "ADMIN") redirect("/mr/dashboard");

  const { supabase } = auth;

  const { data: profiles } = await supabase
    .from("mr_profiles")
    .select("id, full_name, email, role, region, manager_id, created_at")
    .order("created_at", { ascending: false });

  const managers = (profiles ?? []).filter(
    (p: { role: string }) => p.role === "MANAGER" || p.role === "ADMIN"
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">MR Users</h1>
      <p className="text-sm text-slate-500">
        Create and manage Medical Rep, Manager, and Admin accounts. Assign a manager to MRs so they appear in that manager&apos;s dashboard and pharmacy assignments.
      </p>
      <MrUsersClient
        profiles={profiles ?? []}
        managers={managers}
        canCreate={auth.profile.role === "ADMIN"}
      />
    </div>
  );
}
