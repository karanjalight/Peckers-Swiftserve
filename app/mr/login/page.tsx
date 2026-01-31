import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { MrLoginForm } from "./MrLoginForm";

export default async function MrLoginPage() {
  const auth = await getMrAuth();
  if (!auth.error) {
    redirect("/mr");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-800">MR Field Intelligence</h1>
          <p className="mt-1 text-sm text-slate-500">
            Medical Rep Login
          </p>
        </div>
        <MrLoginForm />
        <p className="text-center text-xs text-slate-500">
          Use your company email and password
        </p>
      </div>
    </div>
  );
}
