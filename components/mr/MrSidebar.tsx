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

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/mr/dashboard", icon: LayoutDashboard, roles: ["MANAGER", "ADMIN"] },
  { title: "Pharmacies", url: "/mr/pharmacies", icon: MapPin },
  { title: "New Visit", url: "/mr/pharmacies", icon: PlusCircle, roles: ["MR"] },
  { title: "Visit History", url: "/mr/history", icon: History },
  { title: "Products", url: "/mr/products", icon: Package, roles: ["MANAGER", "ADMIN"] },
  { title: "Reports", url: "/mr/reports", icon: FileBarChart },
  { title: "Users", url: "/mr/users", icon: Users, roles: ["ADMIN"] },
];

export function MrSidebar({ user }: MrSidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  });

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="MR Field">
              <Link href="/mr" className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className=" w-8 lg:w-12 shrink-0 rounded-md object-contain"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive =
                  item.url === pathname ||
                  (item.url !== "/mr" && pathname.startsWith(item.url + "/"));
                return (
                  <SidebarMenuItem key={`${item.title}-${item.url}-${item.roles?.join("-") ?? "all"}`}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex w-full flex-col gap-1 px-2 py-2 text-xs">
              <span className="font-medium text-sidebar-foreground truncate">
                {user.name}
              </span>
              <span className="text-muted-foreground truncate">{user.role}</span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action="/api/mr/logout" method="POST" className="w-full">
              <SidebarMenuButton asChild tooltip="Log out">
                <button type="submit" className="w-full cursor-pointer">
                  <LogOut className="size-4 shrink-0" />
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
