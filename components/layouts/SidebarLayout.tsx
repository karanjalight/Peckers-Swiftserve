// components/layouts/SidebarLayout.tsx
"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

interface SidebarLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: string[];
}

export default function SidebarLayout({
  children,
  title = "Dashboard",
  breadcrumb = ["Cytek", title],
}: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb className="w-full">
              <BreadcrumbList className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
                {breadcrumb.slice(0, -1).map((item, idx) => (
                  <BreadcrumbItem key={idx} className="flex items-center">
                    <BreadcrumbLink
                      href="#"
                      className="hover:text-slate-900 transition-colors"
                    >
                      {item}
                    </BreadcrumbLink>
                    <BreadcrumbSeparator className="mx-2 hidden md:inline" />
                  </BreadcrumbItem>
                ))}
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-900 font-medium">
                    {breadcrumb[breadcrumb.length - 1]}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
