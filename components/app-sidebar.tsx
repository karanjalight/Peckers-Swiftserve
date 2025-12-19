"use client";

import * as React from "react";
import {
  BarChart3,
  Box,
  Settings,
  ShoppingCart,
  Users,
  Package,
  FileText,
  Tags,
  Truck,
  HelpCircle,
  PenTool, // you can change this icon
  CreditCard,
  LogOut,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  
} from "@/components/ui/sidebar";

const navData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
      isActive: true,
    },
    {
      title: "Orders",
      url: "/admin/orders",
      icon: Box,
      isActive: true,   
      items: [
        {
          title: "All Orders",
          url: "/admin/orders/all",
        },
        {
          title: "Nanny Orders",
          url: "/admin/orders/nanny",
        },
        {
          title: "Security Orders",
          url: "/admin/orders/security",
        },
      ],
    },

    

    // {
    //   title: "Orders",
    //   url: "/admin/orders",
    //   icon: ShoppingCart,
    // },
    // {
    //   title: "Customers",
    //   url: "/admin/customers",
    //   icon: Users,
    //   isActive: true,
    // },
    // ⭐⭐⭐ NEW BLOGS SECTION ⭐⭐⭐
    {
      title: "ATS",
      url: "/admin/ats/jobs",
      icon: PenTool,
      isActive: false,
      items: [
        {
          title: "Jobs",
          url: "/admin/ats/jobs",
        },
        {
          title: "Applicants",
          url: "/admin/ats/applicants",
        },
      ],
    },
    {
      title: "Blogs",
      url: "/admin/blogs",
      icon: PenTool,
      isActive: false,
      items: [
        {
          title: "All Blogs",
          url: "/admin/blogs",
        },
        {
          title: "Write New Blog",
          url: "/admin/blogs/create",
        },
      ],
    },
    {
      title: "Subscriptions",
      url: "/admin/subscriptions",
      icon: CreditCard,
      isActive: false,
      items: [
        {
          title: "Packages",
          url: "/admin/subscriptions",
        },
        {
          title: "Customers",
          url: "/admin/subscriptions/customers",
        },
        {
          title: "Redemptions",
          url: "/admin/subscriptions/redemptions",
        },
      ],
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: FileText,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ],

  navSecondary: [
    {
      title: "Help & Support",
      url: "/about",
      icon: HelpCircle,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: "Loading...",
    email: "",
    avatar: "/avatars/default.jpg",
  });

  React.useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          name: parsedUser.full_name || parsedUser.name || "User",
          email: parsedUser.email || "",
          avatar: parsedUser.avatar_url || "/avatars/default.jpg",
        });
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
              <div className="flex my-20 items-center justify-center gap-2">
                  <img
                    src="/logo.png"
                    alt="Books Buddies Logo"
                    className="h-12 sm:h-16"
                  />
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        {/* <NavSecondary items={navData.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}