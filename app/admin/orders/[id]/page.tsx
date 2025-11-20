'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  FileText,
  Download,
  Edit2,
  MoreHorizontal,
} from 'lucide-react';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { getOrderById, updateOrderStatus, updateOrderPaymentStatus } from '@/lib/orders';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price_each: number;
  discount_per_item: number;
  subtotal: number;
  is_refunded: boolean;
  refund_reason?: string;
}

interface OrderUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

interface OrderLocation {
  address_line: string;
  city: string;
  county: string;
  postal_code: string;
  latitude: number;
  longitude: number;
}

interface Payment {
  id: string;
  payment_method: string;
  amount: number;
  payment_status: string;
  transaction_ref: string;
  receipt_url: string;
  created_at: string;
  completed_at: string;
}

interface OrderDetail {
  id: string;
  order_number: string;
  user_id: string;
  location_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'unpaid' | 'paid' | 'partially_paid' | 'refunded';
  total_amount: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  notes: string;
  tracking_number: string;
  estimated_delivery_date: string;
  is_express_shipping: boolean;
  is_gift: boolean;
  gift_message: string;
  created_at: string;
  shipped_at: string;
  delivered_at: string;
  order_items: OrderItem[];
  users: OrderUser;
  locations: OrderLocation;
  payments: Payment[];
}

const statusSteps = [
  { id: 1, label: 'Pending', value: 'pending' },
  { id: 2, label: 'Confirmed', value: 'confirmed' },
  { id: 3, label: 'Processing', value: 'processing' },
  { id: 4, label: 'Shipped', value: 'shipped' },
  { id: 5, label: 'Delivered', value: 'delivered' },
  { id: 6, label: 'Completed', value: 'completed' },
];

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPaymentMenu, setShowPaymentMenu] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    try {
      setUpdating(true);
      const additionalData: any = {};
      
      if (newStatus === 'shipped' && !order.shipped_at) {
        additionalData.shipped_at = new Date().toISOString();
      }
      if (newStatus === 'delivered' && !order.delivered_at) {
        additionalData.delivered_at = new Date().toISOString();
      }

      await updateOrderStatus(orderId, newStatus, additionalData);
      
      setOrder({
        ...order,
        status: newStatus as any,
        ...additionalData,
      });
      setShowStatusMenu(false);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    try {
      setUpdating(true);
      await updateOrderPaymentStatus(orderId, newStatus);
      
      setOrder({
        ...order,
        payment_status: newStatus as any,
      });
      setShowPaymentMenu(false);
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'refunded':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'partially_paid':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'refunded':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'processing':
        return <Package className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <MoreHorizontal className="w-5 h-5" />;
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return statusSteps.findIndex((step) => step.value === order.status);
  };

  if (loading) {
    return (
      <SidebarLayout title="Order Details">
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </SidebarLayout>
    );
  }

  if (error || !order) {
    return (
      <SidebarLayout title="Order Details">
        <div className="flex-1 space-y-6 p-2 pt-6 min-h-screen">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <p className="text-red-800">{error || 'Order not found'}</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const subtotal = order.order_items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <SidebarLayout title="Order Details">
      <div className="flex-1 space-y-6 p-2 pt-6 min-h-screen bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {order.order_number}
              </h1>
              <p className="text-slate-600 mt-1">
                Ordered on{' '}
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <button className="p-2 text-slate-600 hover:bg-white rounded-lg">
            <Download className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                Order Status
              </h2>

              {/* Status Steps */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= getCurrentStepIndex();
                    const isCurrent = step.value === order.status;

                    return (
                      <div key={step.id} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            isCompleted
                              ? 'bg-green-100 text-green-600'
                              : 'bg-slate-100 text-slate-400'
                          } ${isCurrent ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <div className="w-2 h-2 bg-current rounded-full" />
                          )}
                        </div>
                        <p
                          className={`text-sm font-medium text-center ${
                            isCompleted ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Timeline Line */}
                <div className="flex items-center gap-2">
                  {statusSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex-1 h-1 ${
                        index <= getCurrentStepIndex()
                          ? 'bg-green-500'
                          : 'bg-slate-200'
                      } ${index === statusSteps.length - 1 ? 'hidden' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* Current Status Badge and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    disabled={updating}
                    className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                  >
                    Change Status
                  </button>

                  {showStatusMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                      {statusSteps.map((step) => (
                        <button
                          key={step.id}
                          onClick={() => handleStatusUpdate(step.value)}
                          disabled={updating}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 disabled:opacity-50"
                        >
                          {step.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  Order Items
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-600">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-600">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-600">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-600">
                        Discount
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-slate-600">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">
                              {item.product_name}
                            </p>
                            {item.is_refunded && (
                              <p className="text-xs text-red-600 mt-1">
                                Refunded: {item.refund_reason}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          Ksh {item.price_each.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.discount_per_item > 0
                            ? `Ksh ${item.discount_per_item.toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-900">
                          Ksh {item.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Summary */}
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <div className="space-y-2 max-w-xs ml-auto">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>Ksh {subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Discount</span>
                      <span className="text-green-600">
                        -Ksh {order.discount_amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.shipping_cost > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping</span>
                      <span>Ksh {order.shipping_cost.toFixed(2)}</span>
                    </div>
                  )}
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax</span>
                      <span>Ksh {order.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span>Ksh {order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {order.payments && order.payments.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Payment Information
                  </h2>
                </div>

                <div className="p-6 space-y-4">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {payment.payment_method.charAt(0).toUpperCase() +
                              payment.payment_method.slice(1)}
                          </p>
                          <p className="text-sm text-slate-600">
                            {payment.transaction_ref}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor(
                            payment.payment_status
                          )}`}
                        >
                          {payment.payment_status.charAt(0).toUpperCase() +
                            payment.payment_status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Amount: Ksh {payment.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Payment Status Update */}
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-slate-600" />
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPaymentStatusColor(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status
                          .replace('_', ' ')
                          .split(' ')
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ')}
                      </span>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setShowPaymentMenu(!showPaymentMenu)}
                        disabled={updating}
                        className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                      >
                        Update Status
                      </button>

                      {showPaymentMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                          {[
                            { label: 'Unpaid', value: 'unpaid' },
                            { label: 'Paid', value: 'paid' },
                            { label: 'Partially Paid', value: 'partially_paid' },
                            { label: 'Refunded', value: 'refunded' },
                          ].map((status) => (
                            <button
                              key={status.value}
                              onClick={() =>
                                handlePaymentStatusUpdate(status.value)
                              }
                              disabled={updating}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 disabled:opacity-50"
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Customer
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Name</p>
                  <p className="font-medium text-slate-900">
                    {order.users.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </p>
                  <a
                    href={`mailto:${order.users.email}`}
                    className="font-medium text-green-600 hover:text-green-700"
                  >
                    {order.users.email}
                  </a>
                </div>
                {order.users.phone && (
                  <div>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </p>
                    <a
                      href={`tel:${order.users.phone}`}
                      className="font-medium text-slate-900"
                    >
                      {order.users.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {order.locations && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </h2>
                <div className="space-y-1 text-slate-600">
                  <p className="font-medium">{order.locations.address_line}</p>
                  <p>
                    {order.locations.city}, {order.locations.county}
                  </p>
                  <p>{order.locations.postal_code}</p>
                </div>
              </div>
            )}

            {/* Tracking Information */}
            {order.tracking_number && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Tracking
                </h2>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-slate-600">Tracking Number</p>
                    <p className="font-mono text-slate-900">
                      {order.tracking_number}
                    </p>
                  </div>
                  {order.estimated_delivery_date && (
                    <div>
                      <p className="text-sm text-slate-600">
                        Est. Delivery
                      </p>
                      <p className="text-slate-900">
                        {new Date(
                          order.estimated_delivery_date
                        ).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes
                </h2>
                <p className="text-slate-600 text-sm">{order.notes}</p>
              </div>
            )}

            {/* Gift Message */}
            {order.is_gift && order.gift_message && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">
                  Gift Message
                </h2>
                <p className="text-blue-800 text-sm italic">
                  "{order.gift_message}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}