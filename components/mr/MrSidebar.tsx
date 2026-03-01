"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  PlusCircle,
  History,
  FileBarChart,
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
  { title: "New visit", url: "/mr/pharmacies", icon: PlusCircle, roles: ["MR"] },
  { title: "Visit history", url: "/mr/history", icon: History },
];

const managementItems: NavItem[] = [
  { title: "Products", url: "/mr/products", icon: Package, roles: ["MANAGER", "ADMIN"] },
  { title: "Reports", url: "/mr/reports", icon: FileBarChart },
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

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <SidebarHeader className="border-b border-slate-200 px-3 py-4 dark:border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Field Intelligence">
              <Link href="/mr/dashboard" className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-8 w-auto shrink-0 object-contain lg:h-9"
                />
                <span className="font-semibold text-slate-800 group-data-[collapsible=icon]:hidden">
                  Field
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Main menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainItems.map((item) => (
                <SidebarMenuItem
                  key={`main-${item.title}-${item.url}`}
                >
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item)}
                    tooltip={item.title}
                    className={cn(
                      "rounded-lg transition-colors",
                      isActive(item) && "bg-[#1e3a5f] font-medium text-white hover:bg-[#2563eb] hover:text-white"
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
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {mgmtItems.map((item) => (
                  <SidebarMenuItem key={`mgmt-${item.title}-${item.url}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item)}
                      tooltip={item.title}
                      className={cn(
                        "rounded-lg transition-colors",
                        isActive(item) && "bg-[#1e3a5f] font-medium text-white hover:bg-[#2563eb] hover:text-white"
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

      <SidebarFooter className="border-t border-slate-200 px-2 py-3 dark:border-slate-800">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <div className="flex w-full flex-col gap-0.5 px-3 py-2 text-xs">
              <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                {user.name}
              </span>
              <span className="truncate text-slate-600 dark:text-slate-400">{user.role}</span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action="/api/mr/logout" method="POST" className="w-full">
              <SidebarMenuButton
                asChild
                tooltip="Log out"
                className="rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <button type="submit" className="w-full cursor-pointer gap-3">
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
