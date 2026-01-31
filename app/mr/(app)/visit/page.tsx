import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";

export default async function MrVisitIndexPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  if (auth.profile.role === "MR") {
    redirect("/mr/pharmacies");
  }
  redirect("/mr/dashboard");
}
