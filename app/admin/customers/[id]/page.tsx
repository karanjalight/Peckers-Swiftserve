'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Copy,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { getCustomerById, verifyCustomerEmail, verifyCustomerPhone, activateCustomer, deactivateCustomer } from '@/lib/customers';

interface Location {
  id: string;
  address_line: string;
  city: string;
  county: string;
  postal_code: string;
  label: string;
  is_default: boolean;
  is_billing: boolean;
  is_shipping: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  order_items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price_each: number;
    subtotal: number;
  }>;
}

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  role: string;
  preferences: any;
  last_login_at: string;
  created_at: string;
  locations: Location[];
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  orders: Order[];
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCustomerById(customerId);
        setCustomer(data);
      } catch (err) {
        console.error('Error fetching customer:', err);
        setError('Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleVerifyEmail = async () => {
    try {
      setActionLoading('email');
      await verifyCustomerEmail(customerId);
      setCustomer((prev) => prev ? { ...prev, is_email_verified: true } : null);
    } catch (err) {
      alert('Failed to verify email');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyPhone = async () => {
    try {
      setActionLoading('phone');
      await verifyCustomerPhone(customerId);
      setCustomer((prev) => prev ? { ...prev, is_phone_verified: true } : null);
    } catch (err) {
      alert('Failed to verify phone');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async () => {
    try {
      setActionLoading('active');
      if (customer?.is_active) {
        await deactivateCustomer(customerId);
        setCustomer((prev) => prev ? { ...prev, is_active: false } : null);
      } else {
        await activateCustomer(customerId);
        setCustomer((prev) => prev ? { ...prev, is_active: true } : null);
      }
    } catch (err) {
      alert('Failed to update customer status');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <SidebarLayout title="Customer Details">
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </SidebarLayout>
    );
  }

  if (error || !customer) {
    return (
      <SidebarLayout title="Customer Details">
        <div className="flex-1 p-6 pt-6 min-h-screen">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 font-semibold">{error || 'Customer not found'}</p>
            <Link
              href="/admin/customers"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Customers
            </Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Customer Details">
      <div className="flex-1 space-y-6 p-2 pt-6 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/customers"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{customer.full_name}</h1>
              <p className="text-slate-600 mt-1">Customer ID: {customer.id}</p>
            </div>
          </div>
          <Link
            href={`/admin/customers/${customer.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit Customer
          </Link>
        </div>

        {/* Status Section */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <div className="flex items-start gap-3  flex-col justify-between mb-2">
              <p className="text-sm font-medium text-slate-600">Account Status</p>
              <button
                onClick={handleToggleActive}
                disabled={actionLoading === 'active'}
                className={`px-8 py-2 rounded text-xs font-medium transition-colors ${
                  customer.is_active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {actionLoading === 'active' ? (
                  <Loader className="w-3 h-3 animate-spin inline" />
                ) : (
                  customer.is_active ? 'Active' : 'Inactive'
                )}
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Member Since</p>
            <p className="text-lg font-bold text-slate-900 mt-2">
              {new Date(customer.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Last Login</p>
            <p className="text-lg font-bold text-slate-900 mt-2">
              {customer.last_login_at
                ? new Date(customer.last_login_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Never'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
        {/* Contact Information */}
        <div className="bg-white border border-slate-300 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-600">Email</p>
                  <p className="text-slate-900 font-medium">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {customer.is_email_verified && (
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </div>
                )}
                {!customer.is_email_verified && (
                  <button
                    onClick={handleVerifyEmail}
                    disabled={actionLoading === 'email'}
                    className="px-3 py-1 bg-green-800 text-white text-xs rounded font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === 'email' ? <Loader className="w-3 h-3 animate-spin" /> : 'Verify'}
                  </button>
                )}
                <button
                  onClick={() => handleCopy(customer.email, 'email')}
                  className="p-2 hover:bg-slate-200 rounded transition-colors"
                >
                  <Copy className={`w-4 h-4 ${copied === 'email' ? 'text-emerald-600' : 'text-slate-400'}`} />
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-600">Phone</p>
                  <p className="text-slate-900 font-medium">{customer.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {customer.is_phone_verified && (
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </div>
                )}
                {!customer.is_phone_verified && customer.phone && (
                  <button
                    onClick={handleVerifyPhone}
                    disabled={actionLoading === 'phone'}
                    className="px-3 py-1 bg-green-800 text-white text-xs rounded font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === 'phone' ? <Loader className="w-3 h-3 animate-spin" /> : 'Verify'}
                  </button>
                )}
                {customer.phone && (
                  <button
                    onClick={() => handleCopy(customer.phone, 'phone')}
                    className="p-2 hover:bg-slate-200 rounded transition-colors"
                  >
                    <Copy className={`w-4 h-4 ${copied === 'phone' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Locations */}
        {customer.locations && customer.locations.length > 0 && (
          <div className="bg-white border border-slate-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Saved Addresses</h2>
            <div className="space-y-3">
              {customer.locations.map((location) => (
                <div
                  key={location.id}
                  className="  rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {location.label || 'Address'}
                          {location.is_default && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">{location.address_line}</p>
                        <p className="text-sm text-slate-600">
                          {location.city}
                          {location.county && `, ${location.county}`}
                          {location.postal_code && ` ${location.postal_code}`}
                        </p>
                        <div className="flex gap-3 mt-2">
                          {location.is_shipping && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                              Shipping
                            </span>
                          )}
                          {location.is_billing && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Billing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
</div>


        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Total Orders</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{customer.total_orders}</p>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Total Spent</p>
            <p className="text-3xl font-bold text-green-800 mt-2">
              Ksh {customer.total_spent.toFixed(2)}
            </p>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Avg. Order Value</p>
            <p className="text-3xl font-bold text-green-800 mt-2">
              Ksh {customer.total_orders > 0 ? (customer.total_spent / customer.total_orders).toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Last Order</p>
            <p className="text-lg font-bold text-slate-900 mt-2">
              {customer.last_order_date
                ? new Date(customer.last_order_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>

        

        {/* Recent Orders */}
        {customer.orders && customer.orders.length > 0 && (
          <div className="bg-white border border-slate-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Order</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <Link href={`/admin/orders/${order.id}`} className="hover:text-green-800 hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        Ksh {order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${getPaymentStatusBadge(
                            order.payment_status
                          )}`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(!customer.orders || customer.orders.length === 0) && (
          <div className="bg-white border border-slate-300 rounded-lg p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No orders yet</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
} 