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
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("sb-auth-token")?.value ?? null;
  const refreshToken = cookieStore.get("sb-refresh-token")?.value ?? null;

  // Helper to create a Supabase client bound to a specific access token
  const createAuthedClient = (token: string | null) =>
    createClient(supabaseUrl, supabaseAnonKey, {
      global: token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    });

  // If we have neither access nor refresh token, treat as not authenticated
  if (!accessToken && !refreshToken) {
    return { error: "Not authenticated" as const };
  }

  let supabase = createAuthedClient(accessToken);

  // Try to get the user with the current access token (if present)
  let {
    data: { user },
    error: authError,
  } =
    accessToken !== null
      ? await supabase.auth.getUser(accessToken)
      : { data: { user: null }, error: null as any };

  // If access token is invalid/expired but we have a refresh token, try to refresh
  if ((!user || authError) && refreshToken) {
    const refreshClient = createAuthedClient(null);
    const { data: refreshData, error: refreshError } =
      await refreshClient.auth.refreshSession({ refresh_token: refreshToken });

    if (
      !refreshError &&
      refreshData?.session?.access_token &&
      refreshData.session.user
    ) {
      accessToken = refreshData.session.access_token;
      supabase = createAuthedClient(accessToken);
      user = refreshData.session.user;
      authError = null;
    }
  }

  // If we still don't have a valid user, the session is invalid
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
