"use client";

import * as React from "react";
import {
  Bell,
  ChevronDown,
  DollarSign,
  Globe,
  PanelLeft,
  ShoppingCart,
  Users,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { MrNavSearch } from "./MrNavSearch";
import type { MrSidebarProps } from "./MrSidebar";

const ROLE_LABELS: Record<MrSidebarProps["user"]["role"], string> = {
  MR: "Medical Rep",
  MANAGER: "Manager",
  ADMIN: "Administrator",
};

interface MrTopNavProps {
  user: MrSidebarProps["user"];
  pageTitle: string;
}

function MrSidebarTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-10 w-10 shrink-0 rounded-full border-slate-800 bg-white text-slate-800 shadow-none hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
    >
      <PanelLeft className="size-5" />
    </Button>
  );
}

export function MrTopNav({ user, pageTitle }: MrTopNavProps) {
  const searchRef = React.useRef<HTMLInputElement>(null);
  const logoutFormRef = React.useRef<HTMLFormElement>(null);
  const roleLabel = ROLE_LABELS[user.role];

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-800/90 bg-white dark:border-slate-700/90 dark:bg-slate-900">
      <form
        ref={logoutFormRef}
        action="/api/mr/logout"
        method="POST"
        className="sr-only"
        aria-hidden="true"
      />
      <h1 className="sr-only">{pageTitle}</h1>
      <div className="flex min-h-[3.75rem] items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4 lg:min-h-[4rem] lg:gap-5 lg:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <MrSidebarTrigger />
          <div className="hidden min-w-0 flex-row items-center gap-2 gap-0.5 sm:flex">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-800 dark:text-slate-400">
              User Role
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex max-w-[200px] items-center gap-2 rounded-full border border-slate-800 bg-white py-1 pl-1.5 pr-2.5 text-left text-sm font-semibold text-slate-900  transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-slate-800 dark:hover:bg-slate-700/80"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                    <Users className="size-4" strokeWidth={2} />
                  </span>
                  <span className="truncate text-xs">{roleLabel}</span>
                  <ChevronDown className="size-4 shrink-0 text-slate-800 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 rounded-xl">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Your assigned role
                </DropdownMenuLabel>
                <DropdownMenuItem disabled className="font-medium">
                  {roleLabel}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <MrNavSearch ref={searchRef} role={user.role} />

        <div className="hidden shrink-0 items-center gap-2 md:flex lg:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-slate-800 bg-white px-3 py-1.5 text-sm font-medium text-slate-800  transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-800 dark:hover:bg-slate-700/80"
              >
                <Globe className="size-4 text-slate-600 dark:text-slate-400" />
                <span>English</span>
                <ChevronDown className="size-4 text-slate-800 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuItem className="font-medium">English</DropdownMenuItem>
              <DropdownMenuItem disabled>French </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator
            orientation="vertical"
            className="h-8 bg-slate-200 dark:bg-slate-600"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-slate-800 bg-white px-3 py-1.5 text-sm font-medium text-slate-800  transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-800 dark:hover:bg-slate-700/80"
              >
                <DollarSign className="size-4 text-slate-600 dark:text-slate-400" />
                <span>KES</span>
                <ChevronDown className="size-4 text-slate-800 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuItem className="font-medium">KES — Kenyan Shilling</DropdownMenuItem>
              <DropdownMenuItem disabled>USD (soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
          <ThemeToggle />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative inline-flex h-10 w-10 rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Cart"
          >
            <ShoppingCart className="size-5" strokeWidth={2} />
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold leading-none text-white dark:bg-slate-100 dark:text-slate-900">
              4
            </span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell className="size-5" strokeWidth={2} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex max-w-[180px] items-center gap-2 rounded-full border border-slate-800 bg-white py-1 pl-1 pr-2 text-left  transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-800 dark:hover:bg-slate-700/80 lg:max-w-[220px] lg:pr-2.5"
              >
                <Avatar className="h-8 w-8 border border-slate-800 dark:border-slate-600">
                  <AvatarFallback className="bg-slate-200 text-xs font-semibold text-slate-800 dark:bg-slate-600 dark:text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-white md:inline">
                  {user.name}
                </span>
                <ChevronDown className="hidden size-4 shrink-0 text-slate-800 opacity-70 md:inline" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex flex-col gap-1 px-1 py-1">
                  <p className="text-sm font-semibold leading-none">{user.name}</p>
                  {user.email ? (
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
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
        </div>
      </div>
    </header>
  );
}
