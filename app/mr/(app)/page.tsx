import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";

export default async function MrHomePage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  redirect("/mr/dashboard");
}
