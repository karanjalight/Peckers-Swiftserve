"use client";

import dynamic from "next/dynamic";

const MrVisitsMapClient = dynamic(
  () => import("./MrVisitsMapClient").then((m) => m.MrVisitsMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 min-h-[420px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
        <p className="text-slate-500 dark:text-slate-400">Loading map…</p>
      </div>
    ),
  }
);

export function MrVisitsMapLoader() {
  return <MrVisitsMapClient />;
}
