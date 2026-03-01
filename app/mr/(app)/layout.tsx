import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { MrSidebarLayout } from "@/components/mr/MrSidebarLayout";

export default async function MrAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getMrAuth();
  if (auth.error) {
    redirect("/mr/login");
  }

  const user = {
    name: auth.profile.full_name ?? "User",
    email: auth.user?.email ?? undefined,
    role: auth.profile.role as "MR" | "MANAGER" | "ADMIN",
  };

  return (
    <div className="mr-app flex min-h-svh bg-white dark:bg-black/90">
      <MrSidebarLayout user={user}>{children}</MrSidebarLayout>
    </div>
  );
}
