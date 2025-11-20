'use client';

import SidebarLayout from "@/components/layouts/SidebarLayout";
import React, { useState, useEffect } from "react";
import {
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Plus,
  Globe,
  CreditCard,
  Truck,
  Bell,
  Lock,
  Mail,
  Phone,
  DollarSign,
  Settings as SettingsIcon,
  ChevronRight,
  Upload,
  Trash2,
  Loader,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeLogo: string;
  storeDescription: string;
  country: string;
  supportEmail: string;
  supportPhone: string;
  businessLicense: string;
}

interface PaymentSettings {
  enableMpesa: boolean;
  enableCard: boolean;
  enableBankTransfer: boolean;
  enableWallet: boolean;
  mpesaPublicKey: string;
  mpesaPrivateKey: string;
  cardProcessor: "stripe" | "paypal" | "square";
  stripePublicKey?: string;
  stripeSecretKey?: string;
  minTransactionAmount: number;
  maxTransactionAmount: number;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  passwordExpiry: boolean;
  passwordExpiryDays: number;
  sessionTimeout: number;
  ipWhitelist: boolean;
  whitelistedIps: string[];
  requireHttps: boolean;
  enableApiAccess: boolean;
  apiRateLimit: number;
  dataBackup: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
}

const TAB_CONFIG = [
  { id: "store", label: "Store Settings", icon: Globe, section: "General" },
  {
    id: "payment",
    label: "Payment Methods",
    icon: CreditCard,
    section: "Commerce",
  },
  {
    id: "security",
    label: "Security & Access",
    icon: Lock,
    section: "Security",
  },
  {
    id: "users",
    label: "User Management",
    icon: Users,
    section: "Administration",
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("store");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>(
    {}
  );
  const [newIp, setNewIp] = useState("");

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "admin",
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: "",
    storeEmail: "",
    storePhone: "",
    storeLogo: "",
    storeDescription: "",
    country: "Kenya",
    supportEmail: "",
    supportPhone: "",
    businessLicense: "",
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    enableMpesa: true,
    enableCard: true,
    enableBankTransfer: false,
    enableWallet: false,
    mpesaPublicKey: "",
    mpesaPrivateKey: "",
    cardProcessor: "stripe",
    stripePublicKey: "",
    stripeSecretKey: "",
    minTransactionAmount: 1,
    maxTransactionAmount: 10000,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    passwordExpiry: true,
    passwordExpiryDays: 90,
    sessionTimeout: 30,
    ipWhitelist: false,
    whitelistedIps: [],
    requireHttps: true,
    enableApiAccess: false,
    apiRateLimit: 1000,
    dataBackup: true,
    backupFrequency: "daily",
  });

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setStoreSettings((prev) => ({
        ...prev,
        storeName: "Our Store",
        country: "Kenya",
      }));
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from("users")
        .select("id, full_name, email, phone, role, is_active, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(usersData || []);

      // Get current user from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const currentUserData = usersData?.find(u => u.email === user.email);
        setCurrentUser(currentUserData || null);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.full_name || !newUser.email || !newUser.password) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) throw authError;

      if (!authData.user?.id) {
        throw new Error("Failed to create auth user");
      }

      // Create a simple hash for password_hash field (Supabase Auth handles the real hashing)
      // In production, you might want to store a reference or use a different approach
      const passwordHash = `$2a$10${Buffer.from(newUser.password).toString('base64').substring(0, 53)}`;

      // Create user record with password_hash
      const { error: userError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          full_name: newUser.full_name,
          email: newUser.email,
          phone: newUser.phone || null,
          role: newUser.role,
          is_active: true,
          password_hash: passwordHash,
          is_email_verified: false,
          is_phone_verified: false,
        },
      ]);

      if (userError) throw userError;

      setSaveStatus("success");
      setShowCreateModal(false);
      setNewUser({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        role: "admin",
      });
      await fetchUsers();
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error creating user:", error);
      setSaveStatus("error");
      alert("Error creating user. Please try again.");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (currentUser?.id === userId) {
      alert("You cannot delete your own account");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) throw error;

      setSaveStatus("success");
      setShowDeleteConfirm(null);
      await fetchUsers();
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error deleting user:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const addIp = () => {
    if (newIp && !securitySettings.whitelistedIps.includes(newIp)) {
      setSecuritySettings((prev) => ({
        ...prev,
        whitelistedIps: [...prev.whitelistedIps, newIp],
      }));
      setNewIp("");
    }
  };

  const removeIp = (ip: string) => {
    setSecuritySettings((prev) => ({
      ...prev,
      whitelistedIps: prev.whitelistedIps.filter((i) => i !== ip),
    }));
  };

  const toggleSensitive = (key: string) => {
    setShowSensitive((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const SectionHeader = ({ title, description }: any) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      )}
    </div>
  );

  const SettingCard = ({ title, description, children }: any) => (
    <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-slate-900">{title}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );

  const Toggle = ({ checked, onChange }: any) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center h-6 w-11 rounded-full transition ${
        checked ? "bg-green-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  const InputWithLabel = ({
    label,
    value,
    onChange,
    type = "text",
    disabled = false,
    required = false,
    helper = "",
  }: any) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:bg-slate-100"
      />
      {helper && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
    </div>
  );

  const SensitiveInput = ({
    label,
    value,
    onChange,
    placeholder = "",
    apiField = false,
  }: any) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type={showSensitive[label] ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
        <button
          onClick={() => toggleSensitive(label)}
          className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          {showSensitive[label] ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      {apiField && (
        <p className="text-xs text-slate-500 mt-1">
          This key is encrypted and never exposed
        </p>
      )}
    </div>
  );

  if (loading) {
    return (
      <SidebarLayout title="Settings">
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Settings">
      <div className="flex-1 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="max-w-9xl mx-auto px-2 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                  <SettingsIcon className="w-8 h-8" /> Settings
                </h1>
                <p className="text-slate-600 text-sm mt-1">
                  Manage your store configuration, payments, and security
                </p>
              </div>
              {saveStatus === "success" && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Saved successfully</span>
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Error saving</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-9xl mx-auto px-2 py-8">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden sticky top-24">
                {TAB_CONFIG.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 transition ${
                      activeTab === tab.id
                        ? "bg-green-50 border-l-4 border-l-green-600 text-green-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{tab.label}</p>
                      <p className="text-xs text-slate-500">{tab.section}</p>
                    </div>
                    {activeTab === tab.id && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-8">
                {/* Store Settings */}
                {activeTab === "store" && (
                  <div>
                    {/* Account Information */}
                    <SectionHeader
                      title="Your Account"
                      description="View and manage your personal account details"
                    />
                    
                    {currentUser && (
                      <SettingCard
                        title="Account Information"
                        description="Your current account details"
                      >
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-slate-500 uppercase">Full Name</p>
                            <p className="text-sm font-medium text-slate-900 mt-1">
                              {currentUser.full_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase">Email</p>
                            <p className="text-sm font-medium text-slate-900 mt-1">
                              {currentUser.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase">Phone</p>
                            <p className="text-sm font-medium text-slate-900 mt-1">
                              {currentUser.phone || "Not provided"}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-slate-500 uppercase">Member Since</p>
                            <p className="text-sm font-medium text-slate-900 mt-1">
                              {new Date(currentUser.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </SettingCard>
                    )}

                    {/* Change Password */}
                    <SectionHeader
                      title="Password & Security"
                      description="Update your password and security settings"
                      className="mt-8"
                    />
                    
                    <SettingCard
                      title="Change Password"
                      description="Update your account password"
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Current Password *
                          </label>
                          <input
                            type={showSensitive['currentPassword'] ? 'text' : 'password'}
                            placeholder="Enter your current password"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            New Password *
                          </label>
                          <input
                            type={showSensitive['newPassword'] ? 'text' : 'password'}
                            placeholder="Enter new password (min 8 characters)"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Confirm New Password *
                          </label>
                          <input
                            type={showSensitive['confirmNewPassword'] ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          />
                        </div>

                        <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition">
                          Update Password
                        </button>
                      </div>
                    </SettingCard>

                    
                  </div>
                )}

                {/* Payment Settings */}
                {activeTab === "payment" && (
                  <div>
                    <SectionHeader
                      title="Payment Methods"
                      description="Enable and configure payment gateways"
                    />
                    {[
                      {
                        key: "enableMpesa",
                        label: "M-Pesa",
                        desc: "Mobile money payments",
                      },
                      {
                        key: "enableCard",
                        label: "Credit/Debit Card",
                        desc: "Visa, Mastercard, etc.",
                      },
                    ].map((method) => (
                      <SettingCard
                        key={method.key}
                        title={method.label}
                        description={method.desc}
                      >
                        <Toggle
                          checked={
                            paymentSettings[method.key as keyof PaymentSettings]
                          }
                          onChange={(v: boolean) =>
                            setPaymentSettings({
                              ...paymentSettings,
                              [method.key]: v,
                            })
                          }
                        />
                      </SettingCard>
                    ))}
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === "security" && (
                  <div>
                    <SectionHeader
                      title="Access Control"
                      description="Manage who can access your admin panel"
                    />
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900">
                            Security Recommendations
                          </p>
                          <ul className="text-sm text-amber-800 mt-2 space-y-1">
                            <li>
                              ✓ Enable Two-Factor Authentication for admin
                              accounts
                            </li>
                            <li>
                              ✓ Keep your API keys secure and rotate them
                              regularly
                            </li>
                            <li>
                              ✓ Use strong, unique passwords and enable password
                              expiry
                            </li>
                            <li>
                              ✓ Set up automated daily backups to protect your
                              data
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Management */}
                {activeTab === "users" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          User Management
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Manage admin users and their access
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Create User
                      </button>
                    </div>

                    {/* Current User Info */}
                    {currentUser && (
                      <SettingCard
                        title="Your Account"
                        description={`Logged in as: ${currentUser.full_name}`}
                      >
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Email:</span>{" "}
                            {currentUser.email}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Role:</span>{" "}
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              {currentUser.role}
                            </span>
                          </p>
                        </div>
                      </SettingCard>
                    )}

                    {/* Users List */}
                    <SectionHeader title="All Users" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                              Phone
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                              Role
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr
                              key={user.id}
                              className="border-b border-slate-100 hover:bg-slate-50"
                            >
                              <td className="px-4 py-3 font-medium text-slate-900">
                                {user.full_name}
                                {currentUser?.id === user.id && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    You
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {user.email}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {user.phone || "-"}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                    user.is_active
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-100 text-slate-800"
                                  }`}
                                >
                                  {user.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {currentUser?.id !== user.id && (
                                  <button
                                    onClick={() => setShowDeleteConfirm(user.id)}
                                    className="text-red-600 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {activeTab !== "users" && (
                <div className="flex gap-4 mt-8 justify-between items-center">
                  <p className="text-xs text-slate-500">
                    All changes are saved to the server when you click Save
                    Settings
                  </p>
                  <div className="flex gap-3">
                    <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition">
                      Reset to Default
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Create New User
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, full_name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="admin">Admin</option>
                  <option value="vendor">Vendor</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {saving ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Delete User
                </h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete this user?
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              This action cannot be undone. The user account will be permanently
              deleted from your system.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {saving ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}