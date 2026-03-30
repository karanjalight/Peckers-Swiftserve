import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { CampaignReportsClient } from "./CampaignReportsClient";

export default async function CampaignReportsPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const isManager = auth.profile.role === "MANAGER" || auth.profile.role === "ADMIN";
  if (!isManager) {
    redirect("/mr/reports");
  }

  return <CampaignReportsClient />;
}

