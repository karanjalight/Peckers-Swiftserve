import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { MrLoginForm } from "./MrLoginForm";
import { MrLoginNavbar } from "./MrLoginNavbar";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
export default async function MrLoginPage() {
  const auth = await getMrAuth();
  if (!auth.error) {
    redirect("/mr");
  }

  return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* <MrLoginNavbar /> */}

      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left: Brand panel (desktop) */}
        <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 p-10 lg:flex">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                               linear-gradient(to bottom, white 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/10">
                <ClipboardList className="h-6 w-6 text-blue-200" />
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
              <span className="text-blue-200">One place.</span>
            </h1>
            <p className="max-w-sm text-base leading-relaxed text-slate-300">
              Log pharmacy visits, product audits, and competitor insights so
              your team always has the full picture.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm text-slate-400">
              <span>Pharmacy check-ins</span>
              <span>Product & prescription audits</span>
              <span>Reports & history</span>
            </div>
          </div>
          <p className="relative text-xs text-slate-500">
            Medical Representatives · Secure sign-in
          </p>
        </div>

        {/* Right: Form – mobile-first */}
        <div className="flex flex-1 flex-col justify-center px-4 pb-8 pt-[4.5rem] sm:px-6 sm:pt-24 lg:px-10 lg:pt-12">
          <div className="mx-auto w-full lg:max-w-[600px]">
            {/* // Mobile hero strip */}
            <div className="mb-8 lg:hidden">
           
              <div className="flex items-center gap-3 rounded-2xl border dark:border-slate-700/60 border-slate-300/60 dark:bg-slate-800/60 bg-slate-100/60 px-4 py-3 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center ">
                <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90 active:opacity-80"
          aria-label="Peckers Services – Home"
        >
          <img
            src="/logo.png"
            alt="Peckers Services Logo"
            className="h-12 w-auto sm:h-10"
          />
        </Link>
                </div>
                <div>
                  <p className="text-sm font-semibold dark:text-white text-slate-800">
                    Field Intelligence
                  </p>
                  <p className="text-xs dark:text-slate-400 text-slate-800">
                    Sign in with your company account
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl  lg:p-6 p-4 ring-1 ring-white/5 lg:backdrop-blur-sm sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight dark:text-white text-slate-800 sm:text-2xl">
                  Sign in
                </h2>
                <p className="mt-1.5 text-sm dark:text-slate-400 text-slate-800">
                  Use your company email and password
                </p>
              </div>
              <MrLoginForm />
            </div>

            <p className="mt-6 text-center text-xs dark:text-slate-500 text-slate-800">
              No account? Ask your manager to add you to the MR team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
