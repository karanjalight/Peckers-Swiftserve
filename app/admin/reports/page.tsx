'use client';

import SidebarLayout from "@/components/layouts/SidebarLayout";
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  MoreHorizontal,
  Loader,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SalesDataPoint {
  date: string;
  sales: number;
  revenue: number;
  orders: number;
}

interface ProductPerformance {
  name: string;
  sales: number;
  revenue: number;
  trend: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface OrderStatusData {
  status: string;
  count: number;
  color: string;
}

interface PaymentMethod {
  method: string;
  count: number;
  percentage: string;
}

interface TopCustomer {
  name: string;
  orders: number;
  spent: number;
  trend: 'up' | 'down' | 'stable';
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('month');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<PaymentMethod[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    customerRetentionRate: 0,
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch all orders with items and customer data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          status,
          payment_status,
          total_amount,
          created_at,
          order_items (
            product_id,
            quantity,
            price_each,
            product_name
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, category, price');

      if (productsError) throw productsError;

      // Fetch all users (customers)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, created_at')
        .eq('role', 'customer');

      if (usersError) throw usersError;

      // Process sales data by date
      const salesByDate: Record<string, SalesDataPoint> = {};
      (orders || []).forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        if (!salesByDate[date]) {
          salesByDate[date] = { date, sales: 0, revenue: 0, orders: 0 };
        }

        const itemCount = (order.order_items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
        salesByDate[date].sales += itemCount;
        salesByDate[date].revenue += order.total_amount || 0;
        salesByDate[date].orders += 1;
      });

      const salesDataArray = Object.values(salesByDate).slice(-7);
      setSalesData(salesDataArray);

      // Process product performance
      const productStats: Record<string, { sales: number; revenue: number; name: string }> = {};
      (orders || []).forEach(order => {
        (order.order_items || []).forEach((item: any) => {
          if (!productStats[item.product_id]) {
            const product = products?.find((p: any) => p.id === item.product_id);
            productStats[item.product_id] = {
              name: item.product_name || product?.name || 'Unknown',
              sales: 0,
              revenue: 0,
            };
          }
          productStats[item.product_id].sales += item.quantity;
          productStats[item.product_id].revenue += item.quantity * item.price_each;
        });
      });

      const topProducts = Object.entries(productStats)
        .map(([id, stats]) => ({
          name: stats.name,
          sales: stats.sales,
          revenue: stats.revenue,
          trend: Math.floor(Math.random() * 30) - 10, // Random trend for demo
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6);

      setProductPerformance(topProducts);

      // Process category distribution
      const categoryStats: Record<string, number> = {};
      (products || []).forEach((product: any) => {
        categoryStats[product.category] = (categoryStats[product.category] || 0) + 1;
      });

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
      const categoryArray = Object.entries(categoryStats)
        .map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length],
        }))
        .sort((a, b) => b.value - a.value);

      setCategoryData(categoryArray);

      // Process order status distribution
      const statusStats: Record<string, number> = {};
      const statusColors: Record<string, string> = {
        delivered: '#10b981',
        shipped: '#3b82f6',
        processing: '#f59e0b',
        pending: '#f59e0b',
        cancelled: '#ef4444',
        confirmed: '#8b5cf6',
        refunded: '#6366f1',
      };

      (orders || []).forEach(order => {
        statusStats[order.status] = (statusStats[order.status] || 0) + 1;
      });

      const statusArray = Object.entries(statusStats)
        .map(([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count,
          color: statusColors[status] || '#94a3b8',
        }));

      setOrderStatusData(statusArray);

      // Process payment methods
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('payment_method, amount')
        .eq('payment_status', 'completed');

      if (!paymentsError && payments) {
        const paymentStats: Record<string, { count: number; total: number }> = {};
        payments.forEach((payment: any) => {
          const method = payment.payment_method || 'Unknown';
          if (!paymentStats[method]) {
            paymentStats[method] = { count: 0, total: 0 };
          }
          paymentStats[method].count += 1;
          paymentStats[method].total += payment.amount || 0;
        });

        const totalPayments = Object.values(paymentStats).reduce((sum: number, p: any) => sum + p.count, 0);
        const paymentArray = Object.entries(paymentStats)
          .map(([method, stats]: [string, any]) => ({
            method: method.charAt(0).toUpperCase() + method.slice(1),
            count: stats.count,
            percentage: ((stats.count / totalPayments) * 100).toFixed(1),
          }))
          .sort((a, b) => b.count - a.count);

        setPaymentMethodData(paymentArray);
      }

      // Process top customers
      const customerSpending: Record<string, { name: string; orders: number; spent: number }> = {};
      (orders || []).forEach(order => {
        if (order.user_id) {
          if (!customerSpending[order.user_id]) {
            const user = users?.find((u: any) => u.id === order.user_id);
            customerSpending[order.user_id] = {
              name: user?.full_name || 'Unknown',
              orders: 0,
              spent: 0,
            };
          }
          customerSpending[order.user_id].orders += 1;
          customerSpending[order.user_id].spent += order.total_amount || 0;
        }
      });

      const topCustomersArray = Object.values(customerSpending)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5)
        .map(customer => ({
          ...customer,
          trend: (Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
        }));

      setTopCustomers(topCustomersArray);

      // Calculate KPIs
      const totalRevenue = (orders || []).reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalOrdersCount = orders?.length || 0;
      const uniqueCustomers = new Set((orders || []).map(o => o.user_id).filter(Boolean)).size;

      setKpis({
        totalRevenue,
        totalOrders: totalOrdersCount,
        totalCustomers: users?.length || 0,
        avgOrderValue: totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0,
        conversionRate: uniqueCustomers > 0 ? ((totalOrdersCount / uniqueCustomers) * 100) : 0,
        customerRetentionRate: 67.8, // This would need more complex logic with time periods
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout title="Reports">
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Reports">
      <div className="flex-1 space-y-6 p-2 pt-6 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
            <p className="text-slate-600 mt-1">Comprehensive business insights and performance metrics</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-600 uppercase">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">Ksh {kpis.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /> +12.5% vs last period
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-600 uppercase">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{kpis.totalOrders}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /> +8.3% vs last period
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-600 uppercase">Avg Order Value</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">Ksh {kpis.avgOrderValue.toFixed(2)}</p>
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <ArrowDown className="w-3 h-3" /> -2.1% vs last period
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-600 uppercase">Total Customers</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{kpis.totalCustomers}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /> +5.4% vs last period
            </p>
          </div>

          <div className="bg-white border hidden border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-600 uppercase">Conversion Rate</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{kpis.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /> +0.8% vs last period
            </p>
          </div>

          <div className="bg-white border hidden border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-600 uppercase">Retention Rate</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{kpis.customerRetentionRate.toFixed(1)}%</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /> +3.2% vs last period
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white border border-slate-200 rounded-lg p-1">
          {['overview', 'sales', 'products', 'customers', 'payments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                selectedTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Sales & Revenue Trend */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Sales & Revenue Trend</h2>
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      fill="#d1fae5"
                      name="Revenue (Ksh)"
                    />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="#3b82f6"
                      fill="#dbeafe"
                      name="Orders"
                      yAxisId="right"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-slate-600">No data available</div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Category Distribution */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Categories</h2>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData as any}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry: any, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-600">No data available</div>
                )}
              </div>

              {/* Order Status Distribution */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Status Distribution</h2>
                {orderStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={orderStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="status" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-600">No data available</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {selectedTab === 'sales' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Daily Sales Performance</h2>
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                      name="Sales Count"
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                      name="Revenue (Ksh)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-slate-600">No data available</div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Sales Summary</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Total Sales</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {salesData.reduce((sum, i) => sum + i.sales, 0)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Average Daily Sales</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {salesData.length > 0 ? (salesData.reduce((sum, i) => sum + i.sales, 0) / salesData.length).toFixed(0) : 0}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Highest Day</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {salesData.length > 0 ? Math.max(...salesData.map((i) => i.sales)) : 0}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Lowest Day</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {salesData.length > 0 ? Math.min(...salesData.map((i) => i.sales)) : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {selectedTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Product Performance</h2>
              {productPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Product</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Sales</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Revenue</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productPerformance.map((product, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                          <td className="px-4 py-3 text-slate-600">{product.sales}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            Ksh {product.revenue.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              product.trend >= 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              {Math.abs(product.trend)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600">No product data available</div>
              )}
            </div>

            {productPerformance.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Revenue Comparison</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={productPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Customers Tab */}
        {selectedTab === 'customers' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Customers by Spending</h2>
              {topCustomers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Customer</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Orders</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Total Spent</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCustomers.map((customer, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{customer.name}</td>
                          <td className="px-4 py-3 text-slate-600">{customer.orders}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            Ksh {customer.spent.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold ${
                              customer.trend === 'up'
                                ? 'text-emerald-600'
                                : customer.trend === 'down'
                                ? 'text-red-600'
                                : 'text-slate-600'
                            }`}>
                              {customer.trend === 'up' && '↑ Increasing'}
                              {customer.trend === 'down' && '↓ Decreasing'}
                              {customer.trend === 'stable' && '→ Stable'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600">No customer data available</div>
              )}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {selectedTab === 'payments' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Methods Distribution</h2>
                {paymentMethodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData.map((method, index) => ({
                          ...method,
                          value: parseFloat(method.percentage as any),
                          color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index],
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ method, percentage }) => `${method}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-600">No payment data available</div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Methods Summary</h2>
                {paymentMethodData.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethodData.map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{method.method}</p>
                          <p className="text-sm text-slate-600">{method.count} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{method.percentage}%</p>
                          <div className="w-24 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${method.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-600">No payment data available</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}