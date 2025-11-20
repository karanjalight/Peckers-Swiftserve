'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  AlertCircle,
  UserPlus,
  Loader,
} from 'lucide-react';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { getAllCustomersWithStats, deleteCustomer, getCustomerStats } from '@/lib/customers';

interface Location {
  address_line: string;
  city: string;
  county: string;
  postal_code: string;
  is_default: boolean;
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
  last_login_at: string;
  created_at: string;
  locations: Location[];
}

interface CustomerWithStats extends Customer {
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    verified: 0,
    totalSpent: 0,
  });

  // Fetch customers and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const customersData = await getAllCustomersWithStats();
        const statsData = await getCustomerStats();

        setCustomers(customersData);
        
        // Calculate total spent across all customers
        const totalSpent = customersData.reduce((sum, customer) => sum + customer.total_spent, 0);

        setStats({
          total: statsData.total,
          active: statsData.active,
          verified: statsData.fullyVerified,
          totalSpent: totalSpent,
        });
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        const matchSearch =
          customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer.phone?.includes(searchTerm) || false);

        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && customer.is_active) ||
          (statusFilter === 'inactive' && !customer.is_active);

        const matchVerification =
          verificationFilter === 'all' ||
          (verificationFilter === 'verified' &&
            customer.is_email_verified &&
            customer.is_phone_verified) ||
          (verificationFilter === 'partial' &&
            (customer.is_email_verified || customer.is_phone_verified) &&
            !(customer.is_email_verified && customer.is_phone_verified)) ||
          (verificationFilter === 'unverified' &&
            !customer.is_email_verified &&
            !customer.is_phone_verified);

        return matchSearch && matchStatus && matchVerification;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'spent-high':
            return b.total_spent - a.total_spent;
          case 'spent-low':
            return a.total_spent - b.total_spent;
          case 'orders':
            return b.total_orders - a.total_orders;
          case 'newest':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [customers, searchTerm, statusFilter, verificationFilter, sortBy]);

  const handleDeleteCustomer = async (id: string) => {
    try {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Failed to delete customer');
    }
  };

  const getDefaultLocation = (locations: Location[]) => {
    const defaultLoc = locations?.find((l) => l.is_default);
    return defaultLoc || locations?.[0];
  };

  const getVerificationBadges = (customer: Customer) => {
    return (
      <div className="flex items-center gap-1">
        {customer.is_email_verified && (
          <div
            className="p-1 bg-emerald-100 rounded"
            title="Email verified"
          >
            <Mail className="w-3 h-3 text-emerald-600" />
          </div>
        )}
        {customer.is_phone_verified && (
          <div
            className="p-1 bg-emerald-100 rounded"
            title="Phone verified"
          >
            <Phone className="w-3 h-3 text-emerald-600" />
          </div>
        )}
        {!customer.is_email_verified && (
          <div
            className="p-1 bg-red-100 rounded"
            title="Email not verified"
          >
            <Mail className="w-3 h-3 text-red-400" />
          </div>
        )}
        {!customer.is_phone_verified && (
          <div
            className="p-1 bg-red-100 rounded"
            title="Phone not verified"
          >
            <Phone className="w-3 h-3 text-red-400" />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <SidebarLayout title="Customers">
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Customers">
      <div className="flex-1 space-y-6 p-2 pt-6 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-600 mt-1">
              Manage and view customer information
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
            <Link
              href="/admin/customers/new"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Add Customer
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Total Customers</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {stats.total}
            </p>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Active Customers</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">
              {stats.active}
            </p>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Verified Customers</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {stats.verified}
            </p>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              Ksh {stats.totalSpent.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-300 rounded-lg p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Verification Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Verification
              </label>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="verified">Fully Verified</option>
                <option value="partial">Partially Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>

            {/* Sort */}
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
                <option value="spent-high">Highest Spent</option>
                <option value="spent-low">Lowest Spent</option>
                <option value="orders">Most Orders</option>
              </select>
            </div>

            {/* Results */}
            <div className="flex items-end ">
              <div className="text-sm mb-2 text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filteredCustomers.length}
                </span>{' '}
                customers found
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50">
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Last Order
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const defaultLocation = getDefaultLocation(customer.locations);
                  return (
                    <tr
                      key={customer.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {customer.full_name}
                          </p>
                          {defaultLocation && (
                            <p className="text-xs text-slate-500">
                              {defaultLocation.address_line}, {defaultLocation.city}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-600">{customer.email}</p>
                          <p className="text-xs text-slate-600">{customer.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-900">
                            {customer.total_orders}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        Ksh {customer.total_spent.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {customer.last_order_date ? (
                          new Date(customer.last_order_date).toLocaleDateString(
                            'en-US',
                            {
                              year: '2-digit',
                              month: 'short',
                              day: 'numeric',
                            }
                          )
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                         
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-sm">
                No customers found. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Delete Customer
                  </h3>
                  <p className="text-sm text-slate-600">
                    Are you sure you want to delete this customer?
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                This action cannot be undone. The customer's profile will be
                permanently deleted from your database.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomer(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Customer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}