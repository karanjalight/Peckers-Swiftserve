/**
 * MR Field Intelligence - Server-side Supabase client
 * Uses existing cookie-based auth (sb-auth-token)
 */
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type MrRole = "MR" | "MANAGER" | "ADMIN" | "CLIENT";

export interface MrProfile {
  id: string;
  full_name: string;
  role: MrRole;
  region: string | null;
  manager_id: string | null;
  email: string | null;
  created_at: string;
}

/**
 * Create Supabase client with auth from cookies (for Server Components / Server Actions)
 */
export async function getMrSupabase() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-auth-token")?.value;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });

  return supabase;
}

/**
 * Get authenticated Supabase client and verify MR user.
 * Returns { supabase, user, profile } or { error } if not authenticated / not MR user.
 */
export async function getMrAuth() {
  const supabase = await getMrSupabase();

  const accessToken = (await cookies()).get("sb-auth-token")?.value;
  if (!accessToken) {
    return { error: "Not authenticated" as const };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return { error: "Invalid session" as const };
  }

  const { data: profile, error: profileError } = await supabase
    .from("mr_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Not an MR system user" as const };
  }

  return {
    supabase,
    user,
    profile: profile as MrProfile,
    error: null as null,
  };
}

/**
 * Require MR role (Medical Rep only) - for check-in/check-out/audit actions
 */
export async function requireMrRole() {
  const auth = await getMrAuth();
  if (auth.error) return auth;
  if (auth.profile.role !== "MR") {
    return { error: "MR role required" as const };
  }
  return auth;
}

/**
 * Require Manager or Admin - for dashboard access
 */
export async function requireManagerOrAdmin() {
  const auth = await getMrAuth();
  if (auth.error) return auth;
  if (auth.profile.role !== "MANAGER" && auth.profile.role !== "ADMIN") {
    return { error: "Manager or Admin role required" as const };
  }
  return auth;
}

/**
 * Require Manager, Admin, or Client - for analytics / products where
 * client portal users should have similar read/management capabilities
 * to Admins, but without any access to MR user provisioning.
 */
export async function requireManagerAdminOrClient() {
  const auth = await getMrAuth();
  if (auth.error) return auth;
  if (
    auth.profile.role !== "MANAGER" &&
    auth.profile.role !== "ADMIN" &&
    auth.profile.role !== "CLIENT"
  ) {
    return { error: "Manager, Admin or Client role required" as const };
  }
  return auth;
}
