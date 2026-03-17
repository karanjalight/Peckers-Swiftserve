import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { CampaignVisitClient } from "./CampaignVisitClient";

export default async function CampaignVisitPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  if (auth.profile.role !== "MR") {
    redirect("/mr/dashboard");
  }

  const user = {
    id: auth.user.id,
    name: auth.profile.full_name ?? "Medical rep",
    region: auth.profile.region ?? "Nairobi",
  };

  return <CampaignVisitClient currentMr={user} />;
}

