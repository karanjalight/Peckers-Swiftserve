"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UserPlus,
  Loader2,
  Users,
  Mail,
  Key,
  Shield,
  UserCircle,
  MapPin,
  Sparkles,
} from "lucide-react";
import { CredentialsCard } from "./CredentialsCard";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  region: string | null;
  manager_id: string | null;
  created_at: string;
}

type Manager = { id: string; full_name: string; role: string };

export function MrUsersClient({
  profiles,
  managers,
  canCreate,
}: {
  profiles: Profile[];
  managers: Manager[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<{
    email: string;
    fullName: string;
    role: string;
    temporaryPassword: string;
  } | null>(null);
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    role: "MR",
    region: "",
    managerId: "",
    password: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCredentials(null);

    try {
      const res = await fetch("/api/mr/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          fullName: form.fullName,
          role: form.role,
          region: form.region || null,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setCredentials({
        email: data.user.email,
        fullName: data.user.fullName,
        role: data.user.role,
        temporaryPassword: data.temporaryPassword,
      });

      setForm({ email: "", fullName: "", role: "MR", region: "", managerId: "", password: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  function generatePassword() {
    const chars =
      "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((f) => ({ ...f, password: pwd }));
  }

  const inputClass =
    "h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";
  const selectClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

  return (
    <div className="space-y-8">
      {canCreate && (
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/30 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60">
          <div className="border-b border-slate-200/80 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-cyan-500/10 px-6 py-5">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600">
                  <UserPlus className="h-5 w-5" />
                </span>
                Create MR Account
              </CardTitle>
              <CardDescription className="mt-1.5 text-slate-600">
                New users can log in at <span className="font-medium text-teal-700">/mr/login</span> with the credentials you provide.
              </CardDescription>
            </CardHeader>
          </div>
          <CardContent className="px-6 py-6 sm:px-8 sm:py-7">
            <form onSubmit={handleCreate} className="space-y-8">
              {/* Profile */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <UserCircle className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Profile</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-700">Full Name</Label>
                    <Input
                      id="fullName"
                      className={inputClass}
                      value={form.fullName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fullName: e.target.value }))
                      }
                      placeholder="e.g. Jane Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      className={inputClass}
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="jane@company.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role & assignment */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Role & assignment</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-slate-700">Role</Label>
                    <select
                      id="role"
                      value={form.role}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, role: e.target.value }))
                      }
                      className={selectClass}
                    >
                      <option value="MR">MR (Medical Rep)</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-slate-700">Region <span className="font-normal text-slate-400">(optional)</span></Label>
                    <Input
                      id="region"
                      className={inputClass}
                      value={form.region}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, region: e.target.value }))
                      }
                      placeholder="e.g. Nairobi"
                    />
                  </div>
                </div>
                {(form.role === "MR" || form.role === "MANAGER") && managers.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="managerId" className="text-slate-700">
                      Manager <span className="font-normal text-slate-400">(optional)</span>
                    </Label>
                    <select
                      id="managerId"
                      value={form.managerId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, managerId: e.target.value }))
                      }
                      className={selectClass}
                    >
                      <option value="">None</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} ({m.role})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500">
                      For MRs: who supervises them. For Managers: optional reporting line.
                    </p>
                  </div>
                )}
              </div>

              {/* Security */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <Shield className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Security</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">Temporary Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type="text"
                        className={`${inputClass} pl-10 font-mono`}
                        value={form.password}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, password: e.target.value }))
                        }
                        placeholder="Min 6 characters"
                        required
                        minLength={6}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                      className="h-11 shrink-0 gap-2 rounded-lg border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-teal-700 focus:ring-2 focus:ring-teal-500/20"
                      title="Generate secure password"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    User will receive this password and can change it after first login.
                  </p>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-lg bg-teal-600 px-6 font-medium text-white shadow-md hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
                {loading && (
                  <span className="text-sm text-slate-500">Please wait…</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {credentials && (
        <CredentialsCard
          email={credentials.email}
          fullName={credentials.fullName}
          role={credentials.role}
          temporaryPassword={credentials.temporaryPassword}
          onClose={() => setCredentials(null)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Existing Users
          </CardTitle>
          <CardDescription>
            {profiles.length} user{profiles.length !== 1 ? "s" : ""} in the MR
            system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No users yet. Create one above.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Manager</th>
                    <th className="px-4 py-3 text-left font-medium">Region</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => {
                    const manager = p.manager_id
                      ? managers.find((m) => m.id === p.manager_id)
                      : null;
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{p.full_name}</td>
                        <td className="px-4 py-3 text-slate-600">{p.email || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.role === "ADMIN"
                                ? "bg-violet-100 text-violet-800"
                                : p.role === "MANAGER"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {p.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {manager ? manager.full_name : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {p.region || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
