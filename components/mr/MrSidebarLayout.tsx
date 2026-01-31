"use client";

import { MrSidebar } from "./MrSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import type { MrSidebarProps } from "./MrSidebar";

interface MrSidebarLayoutProps {
  children: React.ReactNode;
  user: MrSidebarProps["user"];
}

export function MrSidebarLayout({ children, user }: MrSidebarLayoutProps) {
  return (
    <SidebarProvider>
      <MrSidebar user={user} />
      <SidebarInset className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
        </header>
        <main className="min-h-0 flex-1 overflow-auto bg-slate-50">
          <div className="mx-auto w-full lg:px-12 px-4 py-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
