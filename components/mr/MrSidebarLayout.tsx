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

const PAGE_TITLES: Record<string, string> = {
  "/mr": "Home",
  "/mr/dashboard": "Dashboard",
  "/mr/pharmacies": "Pharmacies",
  "/mr/history": "Visit History",
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
    <SidebarProvider>
      <MrSidebar user={user} />
      <SidebarInset className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900 sm:gap-4 sm:px-4 lg:px-6">
          <SidebarTrigger className="-ml-1 size-8 shrink-0 text-slate-700 dark:text-slate-200 sm:size-9" />
          <Separator orientation="vertical" className="h-5 hidden sm:block dark:bg-slate-600" />
          <Link
            href="/mr"
            className="hidden shrink-0 sm:flex sm:items-center sm:gap-2 lg:hidden"
            aria-label="Home"
          >
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </Link>
          <span className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
            {pageTitle}
          </span>
          <div className="flex-1" />
          <div className="hidden max-w-[200px] flex-1 sm:max-w-[240px] md:block lg:max-w-[280px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <Input
                type="search"
                placeholder="Search"
                className="h-9 rounded-xl border-slate-200 bg-slate-100 pl-9 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
                aria-label="Search"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button
              type="button"
              className="relative rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" aria-hidden />
            </button>
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 py-1.5 pl-2 pr-1.5 dark:border-slate-600 dark:bg-slate-800">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-600 text-xs font-medium text-white dark:bg-slate-500">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden max-w-[100px] truncate text-sm font-medium text-slate-800 dark:text-slate-200 md:inline lg:max-w-[120px]">
                {user.name}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
            </div>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto bg-white dark:bg-background pb-24 md:pb-0">
          <div className="mx-auto w-full px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-6">
            {children}
          </div>
        </main>
        <MrBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
