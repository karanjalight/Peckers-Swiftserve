import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { MrCreateVisitClient } from "./MrCreateVisitClient";

export default async function MrCreateVisitPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  if (auth.profile.role !== "MR") {
    redirect("/mr/dashboard");
  }

  const { supabase } = auth;

  const { data: assignments } = await supabase
    .from("mr_pharmacy_assignments")
    .select(
      `
      pharmacy_id,
      mr_pharmacies (
        id,
        name,
        region,
        sub_region
      )
    `
    )
    .eq("mr_id", auth.user.id)
    .order("created_at", { ascending: false });

  const pharmacies =
    assignments
      ?.map((a) => {
        const phRaw = a.mr_pharmacies as
          | { id: string; name: string; region: string; sub_region?: string | null }
          | { id: string; name: string; region: string; sub_region?: string | null }[]
          | null;
        if (!phRaw) return null;
        const ph = Array.isArray(phRaw) ? phRaw[0] : phRaw;
        return {
          id: ph.id,
          name: ph.name,
          region: ph.region,
          subRegion: ph.sub_region ?? null,
        };
      })
      .filter(Boolean) ?? [];

  return <MrCreateVisitClient pharmacies={pharmacies} />;
}

