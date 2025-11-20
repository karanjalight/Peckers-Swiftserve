"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  ChevronDown,
  Package,
  Truck,
  CheckCircle,
  Clock,
  X,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Loader,
} from "lucide-react";
import SidebarLayout from "@/components/layouts/SidebarLayout";
// import { createClient } from '@/lib/supabase';
// import { createClient } from '@/lib/supabase';
import { supabase } from "@/lib/supabase";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_each: number;
  discount_per_item: number;
  subtotal: number;
  is_refunded: boolean;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  payment_status: "unpaid" | "paid" | "partially_paid" | "refunded";
  total_amount: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  items: OrderItem[];
  tracking_number?: string;
  estimated_delivery_date?: string;
  is_express_shipping: boolean;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
}

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get("status") || "all";
  const paymentFromUrl = searchParams.get("payment") || "all";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(statusFromUrl);
  const [paymentFilter, setPaymentFilter] = useState(paymentFromUrl);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Update state when URL params change
  useEffect(() => {
    setStatusFilter(statusFromUrl);
  }, [statusFromUrl]);

  useEffect(() => {
    setPaymentFilter(paymentFromUrl);
  }, [paymentFromUrl]);

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch orders with user and order items
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(
            `
            id,
            order_number,
            user_id,
            status,
            payment_status,
            total_amount,
            shipping_cost,
            tax_amount,
            discount_amount,
            tracking_number,
            estimated_delivery_date,
            is_express_shipping,
            created_at,
            shipped_at,
            delivered_at,
            order_items (
              id,
              product_name,
              quantity,
              price_each,
              discount_per_item,
              subtotal,
              is_refunded
            ),
            users (
              full_name,
              email
            )
            `
          )
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        // Transform data to match our interface
        const transformedOrders: Order[] = (ordersData || []).map(
          (order: any) => ({
            id: order.id,
            order_number: order.order_number,
            user_id: order.user_id,
            customer_name: order.users?.full_name || "Unknown",
            customer_email: order.users?.email || "unknown@example.com",
            status: order.status,
            payment_status: order.payment_status,
            total_amount: order.total_amount,
            shipping_cost: order.shipping_cost,
            tax_amount: order.tax_amount,
            discount_amount: order.discount_amount,
            tracking_number: order.tracking_number,
            estimated_delivery_date: order.estimated_delivery_date,
            is_express_shipping: order.is_express_shipping,
            created_at: order.created_at,
            shipped_at: order.shipped_at,
            delivered_at: order.delivered_at,
            items: order.order_items || [],
          })
        );

        setOrders(transformedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [supabase]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchSearch =
          (order.order_number?.toLowerCase() ?? "").includes(
            searchTerm.toLowerCase()
          ) ||
          (order.customer_name?.toLowerCase() ?? "").includes(
            searchTerm.toLowerCase()
          ) ||
          (order.customer_email?.toLowerCase() ?? "").includes(
            searchTerm.toLowerCase()
          );

        const matchStatus =
          statusFilter === "all" || order.status === statusFilter;
        const matchPayment =
          paymentFilter === "all" || order.payment_status === paymentFilter;

        return matchSearch && matchStatus && matchPayment;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "oldest":
            return (
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
            );
          case "amount-high":
            return b.total_amount - a.total_amount;
          case "amount-low":
            return a.total_amount - b.total_amount;
          case "newest":
          default:
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
        }
      });
  }, [orders, searchTerm, statusFilter, paymentFilter, sortBy]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-300";
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "shipped":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      case "refunded":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-emerald-600 font-semibold";
      case "unpaid":
        return "text-red-600 font-semibold";
      case "partially_paid":
        return "text-amber-600 font-semibold";
      case "refunded":
        return "text-green-600 font-semibold";
      default:
        return "text-gray-600 font-semibold";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total_amount, 0),
  };

  const handleExport = async () => {
    const csvContent = [
      [
        "Order #",
        "Customer",
        "Email",
        "Status",
        "Payment Status",
        "Amount",
        "Date",
      ],
      ...orders.map((o) => [
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.status,
        o.payment_status,
        o.total_amount.toFixed(2),
        new Date(o.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <SidebarLayout title="Orders">
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Orders">
      <div className="flex-1 space-y-6 p-2 pt-6 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
            <p className="text-slate-600 mt-1">
              Manage and track customer orders
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {stats.total}
            </p>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Pending</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {stats.pending}
            </p>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Processing</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {stats.processing}
            </p>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Shipped</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {stats.shipped}
            </p>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">
              Ksh {stats.totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-300 rounded-lg p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Order #, customer..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Order Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setStatusFilter(newStatus);
                  setCurrentPage(1);
                  // Update URL
                  const params = new URLSearchParams(window.location.search);
                  if (newStatus === "all") {
                    params.delete("status");
                  } else {
                    params.set("status", newStatus);
                  }
                  const newUrl = params.toString()
                    ? `${window.location.pathname}?${params.toString()}`
                    : window.location.pathname;
                  window.history.pushState({}, "", newUrl);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Payment Status
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => {
                  const newPayment = e.target.value;
                  setPaymentFilter(newPayment);
                  setCurrentPage(1);
                  // Update URL
                  const params = new URLSearchParams(window.location.search);
                  if (newPayment === "all") {
                    params.delete("payment");
                  } else {
                    params.set("payment", newPayment);
                  }
                  const newUrl = params.toString()
                    ? `${window.location.pathname}?${params.toString()}`
                    : window.location.pathname;
                  window.history.pushState({}, "", newUrl);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Highest Amount</option>
                <option value="amount-low">Lowest Amount</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filteredOrders.length}
                </span>{" "}
                orders found
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50">
                  {/* <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Order
                  </th> */}
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Amount
                  </th>
                  {/* <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Status
                  </th> */}
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    {/* <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {order.order_number}
                        </p>
                        {order.is_express_shipping && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded mt-1 inline-block">
                            Express
                          </span>
                        )}
                      </div>
                    </td> */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.customer_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      Ksh {order.total_amount.toFixed(2)}
                    </td>
                    {/* <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </div>
                    </td> */}
                    <td
                      className={`px-6 py-4 ${getPaymentStatusColor(
                        order.payment_status
                      )}`}
                    >
                      {order.payment_status
                        .replace("_", " ")
                        .split(" ")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "2-digit",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-sm">
                No orders found. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              Showing{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                filteredOrders.length
              )}
              -{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{" "}
              {filteredOrders.length} orders
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      currentPage === page
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <SidebarLayout title="Orders">
          <div className="flex items-center justify-center min-h-screen">
            <Loader className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        </SidebarLayout>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
