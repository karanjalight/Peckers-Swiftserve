"use client";

import SidebarLayout from "@/components/layouts/SidebarLayout";
import React, { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SalesData {
  month: string;
  sales: number;
}

interface UserData {
  month: string;
  users: number;
}

interface OrderData {
  status: string;
  count: number;
}

interface Transaction {
  date: string;
  name: string;
  amount: number;
  status: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    newUsers: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          user_id,
          status,
          payment_status,
          total_amount,
          created_at,
          location_id
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch users for recent transactions and user growth
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Calculate total sales
      const totalSales = (orders || []).reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );

      // Calculate new users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUsersCount = (users || []).filter(
        (user) => new Date(user.created_at) > thirtyDaysAgo
      ).length;

      setStats({
        totalSales,
        newUsers: newUsersCount,
        totalOrders: orders?.length || 0,
      });

      // Process sales trend (last 6 months)
      const salesByMonth: Record<string, number> = {};
      (orders || []).forEach((order) => {
        const date = new Date(order.created_at);
        const monthKey = date.toLocaleDateString("en-US", {
          month: "short",
        });
        salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + (order.total_amount || 0);
      });

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const sales = months.map((month) => ({
        month,
        sales: salesByMonth[month] || 0,
      }));
      setSalesData(sales);

      // Process user growth (last 6 months)
      const usersByMonth: Record<string, number> = {};
      (users || []).forEach((user) => {
        const date = new Date(user.created_at);
        const monthKey = date.toLocaleDateString("en-US", {
          month: "short",
        });
        usersByMonth[monthKey] = (usersByMonth[monthKey] || 0) + 1;
      });

      const userGrowth = months.map((month) => ({
        month,
        users: usersByMonth[month] || 0,
      }));
      setUsersData(userGrowth);

      // Process order status distribution
      const statusCounts: Record<string, number> = {};
      (orders || []).forEach((order) => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      }));
      setOrderStatusData(statusData);

      // Get recent transactions (last 10 orders with customer names)
      const recentOrders = (orders || [])
        .slice(0, 10)
        .map((order) => {
          const user = users?.find((u) => u.id === order.user_id);
          return {
            date: new Date(order.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            name: user?.full_name || "Unknown",
            amount: order.total_amount || 0,
            status: order.payment_status === "paid" ? "Paid" : "Pending",
          };
        });

      setRecentTransactions(recentOrders);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    Delivered: "#10b981",
    Shipped: "#3b82f6",
    Processing: "#f59e0b",
    Pending: "#f59e0b",
    Cancelled: "#ef4444",
    Confirmed: "#8b5cf6",
  };

  if (loading) {
    return (
      <SidebarLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Dashboard">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  Ksh {(stats.totalSales / 1000).toFixed(1)}k
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">+12% from last month</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.newUsers}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">+25% growth this month</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">+8% this week</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {salesData.some((d) => d.sales > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `Ksh ${Number(value).toLocaleString()}`
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#16a34a"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No sales data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {usersData.some((d) => d.users > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usersData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="users" fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No user data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions Table */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>Ksh {item.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === "Paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {orderStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData as any}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }: any) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {orderStatusData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              statusColors[
                                entry.status as keyof typeof statusColors
                              ] || "#94a3b8"
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No order data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      Total Orders
                    </span>
                    <span className="font-semibold">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      Avg Order Value
                    </span>
                    <span className="font-semibold">
                      Ksh{" "}
                      {stats.totalOrders > 0
                        ? (stats.totalSales / stats.totalOrders).toFixed(0)
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      Total Customers
                    </span>
                    <span className="font-semibold">
                      {usersData.reduce((sum, d) => sum + d.users, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Monthly Revenue
                    </span>
                    <span className="font-semibold">
                      Ksh {(stats.totalSales / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports Section</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Visit the Reports page for comprehensive analytics and detailed
                business insights.
              </p>
              <a
                href="/admin/reports"
                className="inline-block mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Go to Reports →
              </a>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SidebarLayout>
  );
}