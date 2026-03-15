"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Map,
  PlusCircle,
  History,
  FileBarChart,
  TrendingDown,
  Users,
  Package,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type MrRole = "MR" | "MANAGER" | "ADMIN";

export interface MrSidebarProps {
  user: { name: string; email?: string; role: MrRole };
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: MrRole[];
}

const mainMenuItems: NavItem[] = [
  { title: "Dashboard", url: "/mr/dashboard", icon: LayoutDashboard },
  { title: "Pharmacies", url: "/mr/pharmacies", icon: MapPin },
  { title: "New visit", url: "/mr/visit/create", icon: PlusCircle, roles: ["MR"] },
  { title: "Visit history", url: "/mr/history", icon: History },
];

const managementItems: NavItem[] = [
  { title: "Maps", url: "/mr/maps", icon: Map, roles: ["MANAGER", "ADMIN"] },
  { title: "Products", url: "/mr/products", icon: Package, roles: ["MANAGER", "ADMIN"] },
  { title: "Reports", url: "/mr/reports", icon: FileBarChart },
  { title: "Lost Sales", url: "/mr/reports/lost-sales", icon: TrendingDown, roles: ["MANAGER", "ADMIN"] },
  { title: "Users", url: "/mr/users", icon: Users, roles: ["ADMIN"] },
];

function filterByRole(items: NavItem[], role: MrRole): NavItem[] {
  return items.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });
}

export function MrSidebar({ user }: MrSidebarProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.url === pathname) return true;
    if (item.url === "/mr") return pathname === "/mr";
    if (pathname.startsWith(item.url + "/")) return true;
    return false;
  };

  const mainItems = filterByRole(mainMenuItems, user.role);
  const mgmtItems = filterByRole(managementItems, user.role);

  const menuButtonBase =
    "rounded-full h-11 px-4 text-base font-medium transition-all duration-200 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-full";
  const menuButtonInactive =
    "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100";
  const menuButtonActive =
    "bg-blue-700 text-white shadow-sm hover:bg-blue-600 hover:text-white dark:bg-blue-600 dark:hover:bg-blue-500";

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-r border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/95"
    >
      <SidebarHeader className="border-b border-slate-200/80 bg-slate-50 dark:bg-slate-800 px-4 py-5 dark:border-slate-700/80">

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Field Intelligence">
              <Link
                href="/mr/dashboard"
                className="flex items-center gap-3 rounded-full px-3 py-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-8 w-auto shrink-0 object-contain lg:h-10 dark:invert"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-50 group-data-[collapsible=icon]:hidden">
                  Field Intelligence
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-3 py-4 dark:bg-slate-900">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Main menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-1.5">
              {mainItems.map((item) => (
                <SidebarMenuItem key={`main-${item.title}-${item.url}`}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item)}
                    tooltip={item.title}
                    className={cn(
                      menuButtonBase,
                      isActive(item) ? menuButtonActive : menuButtonInactive
                    )}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="size-5 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {mgmtItems.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="flex flex-col gap-1.5">
                {mgmtItems.map((item) => (
                  <SidebarMenuItem key={`mgmt-${item.title}-${item.url}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item)}
                      tooltip={item.title}
                      className={cn(
                        menuButtonBase,
                        isActive(item) ? menuButtonActive : menuButtonInactive
                      )}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="size-5 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200/80 px-3 py-4 dark:border-slate-700/80">
        <SidebarMenu className="flex flex-col gap-1.5">
          <SidebarMenuItem>
            <div className="rounded-full px-4 py-2.5">
              <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                {user.name}
              </span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{user.role}</span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action="/api/mr/logout" method="POST" className="w-full">
              <SidebarMenuButton
                asChild
                tooltip="Log out"
                className={cn(
                  menuButtonBase,
                  "rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
              >
                <button type="submit" className="flex w-full cursor-pointer items-center gap-3">
                  <LogOut className="size-5 shrink-0" />
                  <span>Log out</span>
                </button>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
