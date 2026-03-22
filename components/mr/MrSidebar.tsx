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
  Users,
  Package,
  LogOut,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
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

const mainMenuItems: NavItem[] = [
  { title: "Dashboard", url: "/mr/dashboard", icon: LayoutDashboard },
  { title: "Pharmacies", url: "/mr/pharmacies", icon: MapPin },
  { title: "New visit", url: "/mr/visit/create", icon: PlusCircle, roles: ["MR"] },
  { title: "Visit history", url: "/mr/history", icon: History },
];

/** Shown above the Reports submenu */
const managementItemsBeforeReports: NavItem[] = [
  { title: "Maps", url: "/mr/maps", icon: Map, roles: ["MANAGER", "ADMIN"] },
  { title: "Products", url: "/mr/products", icon: Package, roles: ["MANAGER", "ADMIN"] },
];

/** Shown below the Reports submenu */
const managementItemsAfterReports: NavItem[] = [
  { title: "Users", url: "/mr/users", icon: Users, roles: ["ADMIN"] },
];

type ReportSubNavItem = {
  title: string;
  url: string;
  roles?: MrRole[];
};

const reportSubNavItems: ReportSubNavItem[] = [
  {
    title: "Lost sales",
    url: "/mr/reports/lost-sales",
    roles: ["MANAGER", "ADMIN"],
  },
  {
    title: "Regions audited",
    url: "/mr/reports/regions-audited",
  },
  {
    title: "Pharmacies audited (detail)",
    url: "/mr/reports/pharmacies-audited-detail",
  },
  {
    title: "OOS by pharmacy & product",
    url: "/mr/reports/oos-by-pharmacy-product",
  },
  {
    title: "OOS ratio by product",
    url: "/mr/reports/oos-ratio-by-product",
  },
  {
    title: "Pharmacy market share",
    url: "/mr/reports/pharmacy-market-share",
  },
  {
    title: "Top prescribers by product",
    url: "/mr/reports/top-prescribers-by-product",
  },
  {
    title: "Top prescribers per chemist",
    url: "/mr/reports/top-prescribers-per-chemist",
  },
  {
    title: "Substitution",
    url: "/mr/reports/substitution",
  },
  {
    title: "Out of stock",
    url: "/mr/reports/out-of-stock",
  },
  {
    title: "Comparative pricing",
    url: "/mr/reports/comparative-pricing",
  },
];

function filterByRole(items: NavItem[], role: MrRole): NavItem[] {
  return items.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });
}

const navButtonClass =
  "rounded-lg text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 data-[active=true]:bg-[#0b1b53] data-[active=true]:text-white dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white dark:data-[active=true]:bg-blue-700 dark:data-[active=true]:text-white group-data-[collapsible=icon]:rounded-lg";

export function MrSidebar({ user }: MrSidebarProps) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const logoutFormRef = React.useRef<HTMLFormElement>(null);

  const isActive = (item: NavItem) => {
    if (item.url === pathname) return true;
    if (item.url === "/mr") return pathname === "/mr";
    if (pathname.startsWith(item.url + "/")) return true;
    return false;
  };

  const mainItems = filterByRole(mainMenuItems, user.role);
  const mgmtBeforeReports = filterByRole(managementItemsBeforeReports, user.role);
  const mgmtAfterReports = filterByRole(managementItemsAfterReports, user.role);
  const reportSubItemsFiltered = reportSubNavItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  });

  const reportsMenuOpen = pathname.startsWith("/mr/reports");
  const reportsMenuActive = reportsMenuOpen;

  const showManagement =
    mgmtBeforeReports.length > 0 ||
    mgmtAfterReports.length > 0 ||
    reportSubItemsFiltered.length > 0;

  return (
    <Sidebar className="border-r  border-slate-600" variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-gray-800 px-2 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="xl" className="flex items-center justify-center" asChild tooltip="Field Intelligence">
              <Link href="/mr/dashboard" className="gap-3">
                <span className="flex ">
                  <img
                    src="/logo.png"
                    alt=""
                    className="h-16 w-auto object-contain dark:invert"
                  />
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 space-y-6 py-3">
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
          <SidebarGroupLabel className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            Main menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainItems.map((item) => (
                <SidebarMenuItem key={`main-${item.title}-${item.url}`}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item)}
                    tooltip={item.title}
                    className={navButtonClass}
                  >
                    <Link href={item.url} className="gap-3 ">
                      <item.icon className="size-[1.125rem] text-sm shrink-0" />
                      <span className="text-md font-medium ">{item.title} </span>
                    </Link> 
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showManagement && (
          <>
            {/* <SidebarSeparator className="my-3" /> */}
            <SidebarGroup className="group-data-[collapsible=icon]:p-0 border-t border-slate-600">
              <SidebarGroupLabel className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                Management
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {mgmtBeforeReports.map((item) => (
                    <SidebarMenuItem key={`mgmt-${item.title}-${item.url}`}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item)}
                        tooltip={item.title}
                        className={navButtonClass}
                      >
                        <Link href={item.url} className="gap-3">
                          <item.icon className="size-[1.125rem] shrink-0" />
                          <span className="text-md font-medium ">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  <Collapsible asChild defaultOpen={reportsMenuOpen}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={reportsMenuActive}
                        tooltip="Reports"
                        className={navButtonClass}
                      >
                        <Link href="/mr/reports" className="gap-3">
                          <FileBarChart className="size-[1.125rem] shrink-0" />
                          <span className="text-md font-medium ">Reports</span>
                        </Link>
                      </SidebarMenuButton>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction
                          className="rounded-md data-[state=open]:rotate-90"
                          aria-label="Toggle reports submenu"
                        >
                          <ChevronRight className="size-4" />
                        </SidebarMenuAction>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="mx-0 border-slate-600 pl-8">
                          {reportSubItemsFiltered.map((sub) => (
                            <SidebarMenuSubItem key={sub.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === sub.url}
                                size="md"
                              >
                                <Link href={sub.url}>
                                  <span className="text-sm font-medium " >{sub.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  {mgmtAfterReports.map((item) => (
                    <SidebarMenuItem key={`mgmt-${item.title}-${item.url}`}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item)}
                        tooltip={item.title}
                        className={navButtonClass}
                      >
                        <Link href={item.url} className="gap-3">
                          <item.icon className="size-[1.125rem] shrink-0" />
                          <span className="text-md font-medium ">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-600 p-2">
        <form
          ref={logoutFormRef}
          action="/api/mr/logout"
          method="POST"
          className="sr-only"
          aria-hidden="true"
        />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="gap-3 rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-9 w-9 rounded-lg border border-gray-800">
                    <AvatarFallback className="rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-sidebar-foreground/65">
                      {user.email ?? user.role}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-xl"
                side={isMobile ? "bottom" : "top"}
                align="start"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex flex-col gap-2 px-1 py-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-9 w-9 rounded-lg border border-slate-600">
                        <AvatarFallback className="rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate text-sm font-medium leading-none">
                          {user.name}
                        </p>
                        {user.email ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        ) : null}
                        <Badge variant="outline" className="mt-1 text-[10px] font-medium">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 rounded-lg"
                  onSelect={() => logoutFormRef.current?.requestSubmit()}
                >
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
