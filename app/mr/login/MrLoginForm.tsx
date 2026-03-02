"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Mail, Lock } from "lucide-react";

export function MrLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError) throw new Error(signInError.message);
      if (!data.session) throw new Error("No session created");

      await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });

      const { data: profile } = await supabase
        .from("mr_profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!profile) {
        setError("No MR account found for this email. Contact your manager.");
        setLoading(false);
        return;
      }

      router.push("/mr/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-sm font-medium dark:text-slate-300 text-slate-600"
        >
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            disabled={loading}
            className="h-12 rounded-xl border-slate-600 bg-white dark:bg-slate-900 pl-10 text-slate-600 dark:text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 focus:ring-offset-0 focus:ring-offset-slate-900"
            autoComplete="email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-sm font-medium dark:text-slate-300 text-slate-600 "
        >
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            className="h-12 rounded-xl border-slate-600/80 bg-white dark:bg-slate-900 pl-10 text-slate-600 dark:text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 focus:ring-offset-0 focus:ring-offset-slate-900"
            autoComplete="current-password"
          />
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button
        type="submit"
        className="h-12 w-full flex justify-center items-center rounded-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950  font-medium text-white hover:from-blue-950 hover:via-blue-900 hover:to-blue-950 transition hover:bg-blue-500 focus-visible:ring-blue-500/50"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Sign in
          </span>
        )}
      </Button>
    </form>
  );
}
