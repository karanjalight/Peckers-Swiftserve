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
import { Loader, TrendingUp, TrendingDown, Baby, Shield, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SalesData {
  month: string;
  sales: number;
  nanny: number;
  security: number;
  orders: number;
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
  type: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    nannySales: 0,
    securitySales: 0,
    orderSales: 0,
    newUsers: 0,
    totalOrders: 0,
    totalNannyRequests: 0,
    totalSecurityRequests: 0,
    paidNannyRequests: 0,
    paidSecurityRequests: 0,
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

      // Fetch nanny payments
      const { data: nannyPayments, error: nannyPaymentsError } = await supabase
        .from("nanny_payments")
        .select("id, amount, status, created_at, request_id")
        .eq("status", "paid")
        .order("created_at", { ascending: false });

      if (nannyPaymentsError) throw nannyPaymentsError;

      // Fetch security payments
      const { data: securityPayments, error: securityPaymentsError } = await supabase
        .from("security_payments")
        .select("id, amount, status, created_at, request_id")
        .eq("status", "paid")
        .order("created_at", { ascending: false });

      if (securityPaymentsError) throw securityPaymentsError;

      // Fetch nanny requests
      const { data: nannyRequests, error: nannyRequestsError } = await supabase
        .from("nanny_requests")
        .select("id, is_paid, created_at");

      if (nannyRequestsError) throw nannyRequestsError;

      // Fetch security requests
      const { data: securityRequests, error: securityRequestsError } = await supabase
        .from("security_requests")
        .select("id, is_paid, created_at");

      if (securityRequestsError) throw securityRequestsError;

      // Fetch users for recent transactions and user growth
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Calculate sales
      const orderSales = (orders || []).reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );
      const nannySales = (nannyPayments || []).reduce(
        (sum, payment) => sum + parseFloat(payment.amount.toString()),
        0
      );
      const securitySales = (securityPayments || []).reduce(
        (sum, payment) => sum + parseFloat(payment.amount.toString()),
        0
      );
      const totalSales = orderSales + nannySales + securitySales;

      // Calculate new users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUsersCount = (users || []).filter(
        (user) => new Date(user.created_at) > thirtyDaysAgo
      ).length;

      setStats({
        totalSales,
        nannySales,
        securitySales,
        orderSales,
        newUsers: newUsersCount,
        totalOrders: orders?.length || 0,
        totalNannyRequests: nannyRequests?.length || 0,
        totalSecurityRequests: securityRequests?.length || 0,
        paidNannyRequests: (nannyRequests || []).filter((r) => r.is_paid).length,
        paidSecurityRequests: (securityRequests || []).filter((r) => r.is_paid).length,
      });

      // Process sales trend (last 6 months) - combine all revenue sources
      const salesByMonth: Record<string, { sales: number; nanny: number; security: number; orders: number }> = {};
      
      // Process orders
      (orders || []).forEach((order) => {
        const date = new Date(order.created_at);
        const monthKey = date.toLocaleDateString("en-US", {
          month: "short",
        });
        if (!salesByMonth[monthKey]) {
          salesByMonth[monthKey] = { sales: 0, nanny: 0, security: 0, orders: 0 };
        }
        salesByMonth[monthKey].orders += order.total_amount || 0;
        salesByMonth[monthKey].sales += order.total_amount || 0;
      });

      // Process nanny payments
      (nannyPayments || []).forEach((payment) => {
        const date = new Date(payment.created_at);
        const monthKey = date.toLocaleDateString("en-US", {
          month: "short",
        });
        if (!salesByMonth[monthKey]) {
          salesByMonth[monthKey] = { sales: 0, nanny: 0, security: 0, orders: 0 };
        }
        salesByMonth[monthKey].nanny += parseFloat(payment.amount.toString());
        salesByMonth[monthKey].sales += parseFloat(payment.amount.toString());
      });

      // Process security payments
      (securityPayments || []).forEach((payment) => {
        const date = new Date(payment.created_at);
        const monthKey = date.toLocaleDateString("en-US", {
          month: "short",
        });
        if (!salesByMonth[monthKey]) {
          salesByMonth[monthKey] = { sales: 0, nanny: 0, security: 0, orders: 0 };
        }
        salesByMonth[monthKey].security += parseFloat(payment.amount.toString());
        salesByMonth[monthKey].sales += parseFloat(payment.amount.toString());
      });

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const sales = months.map((month) => ({
        month,
        sales: salesByMonth[month]?.sales || 0,
        nanny: salesByMonth[month]?.nanny || 0,
        security: salesByMonth[month]?.security || 0,
        orders: salesByMonth[month]?.orders || 0,
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

      // Get recent transactions - combine orders, nanny, and security payments
      const allTransactions: Transaction[] = [];

      // Add orders
      (orders || []).slice(0, 5).forEach((order) => {
        const user = users?.find((u) => u.id === order.user_id);
        allTransactions.push({
          date: new Date(order.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          name: user?.full_name || "Unknown",
          amount: order.total_amount || 0,
          status: order.payment_status === "paid" ? "Paid" : "Pending",
          type: "Order",
        });
      });

      // Add nanny payments
      (nannyPayments || []).slice(0, 3).forEach((payment) => {
        allTransactions.push({
          date: new Date(payment.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          name: "Nanny Service",
          amount: parseFloat(payment.amount.toString()),
          status: "Paid",
          type: "Nanny",
        });
      });

      // Add security payments
      (securityPayments || []).slice(0, 3).forEach((payment) => {
        allTransactions.push({
          date: new Date(payment.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          name: "Security Service",
          amount: parseFloat(payment.amount.toString()),
          status: "Paid",
          type: "Security",
        });
      });

      // Sort by date and take top 10
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setRecentTransactions(allTransactions.slice(0, 10));
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  Ksh {stats.totalSales.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">All services combined</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="w-5 h-5 text-purple-600" />
                  Nanny Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  Ksh {stats.nannySales.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.paidNannyRequests} paid / {stats.totalNannyRequests} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  Security Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  Ksh {stats.securitySales.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.paidSecurityRequests} paid / {stats.totalSecurityRequests} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  Ksh {stats.orderSales.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.totalOrders} orders
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.newUsers}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Last 30 days</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats.totalNannyRequests + stats.totalSecurityRequests}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.totalNannyRequests} nanny + {stats.totalSecurityRequests} security
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats.totalNannyRequests + stats.totalSecurityRequests > 0
                    ? Math.round(
                        ((stats.paidNannyRequests + stats.paidSecurityRequests) /
                          (stats.totalNannyRequests + stats.totalSecurityRequests)) *
                          100
                      )
                    : 0}
                  %
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Service requests paid
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend by Service</CardTitle>
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
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#16a34a"
                        strokeWidth={2}
                        name="Total Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="nanny"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Nanny Services"
                      />
                      <Line
                        type="monotone"
                        dataKey="security"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Security Services"
                      />
                      <Line
                        type="monotone"
                        dataKey="orders"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Product Orders"
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
                      <TableHead>Customer/Service</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.type === "Nanny"
                                ? "bg-purple-100 text-purple-800"
                                : item.type === "Security"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {item.type}
                          </span>
                        </TableCell>
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
                <CardTitle>Service Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Baby className="w-4 h-4 text-purple-600" />
                      Nanny Revenue
                    </span>
                    <span className="font-semibold">
                      Ksh {stats.nannySales.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-orange-600" />
                      Security Revenue
                    </span>
                    <span className="font-semibold">
                      Ksh {stats.securitySales.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                      Product Orders
                    </span>
                    <span className="font-semibold">
                      Ksh {stats.orderSales.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      Total Requests
                    </span>
                    <span className="font-semibold">
                      {stats.totalNannyRequests + stats.totalSecurityRequests}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Revenue
                    </span>
                    <span className="font-semibold">
                      Ksh {stats.totalSales.toLocaleString()}
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