"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MrSidebar } from "./MrSidebar";
import { MrBottomNav } from "./MrBottomNav";
import { ThemeToggle } from "./ThemeToggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search, Bell, ChevronDown } from "lucide-react";
import type { MrSidebarProps } from "./MrSidebar";
import { MrTopNav } from "./MrTopNav";

const PAGE_TITLES: Record<string, string> = {
  "/mr": "Home",
  "/mr/dashboard": "Dashboard",
  "/mr/pharmacies": "Pharmacies",
  "/mr/history": "Visit History",
  "/mr/maps": "Maps",
  "/mr/products": "Products",
  "/mr/reports": "Reports",
  "/mr/users": "Users",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/mr/pharmacies/")) return "Pharmacy";
  if (pathname.startsWith("/mr/visit/")) return "Visit";
  return "Field Intelligence";
}

interface MrSidebarLayoutProps {
  children: React.ReactNode;
  user: MrSidebarProps["user"];
}

export function MrSidebarLayout({ children, user }: MrSidebarLayoutProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <SidebarProvider className="bg-white dark:bg-slate-900">
      <MrSidebar user={user} />
      <SidebarInset className="flex min-w-0 flex-1 flex-col bg-white dark:bg-slate-900">
        <MrTopNav user={user} pageTitle={pageTitle} />
        <main className="min-h-0 flex-1 overflow-auto bg-white dark:bg-slate-900 pb-24 md:pb-0">
          <div className="mx-auto w-full px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-6">
            {children}
          </div>
        </main>
        <MrBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
