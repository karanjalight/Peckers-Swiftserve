import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { MrLoginForm } from "./MrLoginForm";
import { ClipboardList } from "lucide-react";

export default async function MrLoginPage() {
  const auth = await getMrAuth();
  if (!auth.error) {
    redirect("/mr");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: Brand panel */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 p-10 lg:flex">
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                             linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <ClipboardList className="h-6 w-6 text-teal-200" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Field Intelligence
            </span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Capture every visit.
            <br />
            <span className="text-teal-200">One place.</span>
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-teal-100/90">
            Log pharmacy visits, product audits, and competitor insights so your team always has the full picture.
          </p>
          <div className="flex gap-6 pt-2 text-sm text-teal-200/80">
            <span>Pharmacy check-ins</span>
            <span>•</span>
            <span>Product & prescription audits</span>
            <span>•</span>
            <span>Reports & history</span>
          </div>
        </div>
        <p className="relative text-xs text-teal-300/70">
          Medical Representatives · Secure sign-in
        </p>
      </div>

      {/* Right: Form */}
      <div className="flex flex-1 flex-col justify-center bg-stone-50/80 px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-semibold text-stone-800">
                Field Intelligence
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-lg shadow-stone-200/50">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-stone-900">
                Sign in
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Use your company email and password
              </p>
            </div>
            <MrLoginForm />
          </div>
          <p className="mt-6 text-center text-xs text-stone-500">
            No account? Ask your manager to add you to the MR team.
          </p>
        </div>
      </div>
    </div>
  );
}
