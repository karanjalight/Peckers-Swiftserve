import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  if (!supabaseServiceKey) {
    return NextResponse.json(
      { error: "Service role key not configured" },
      { status: 500 }
    );
  }

  const accessToken = req.cookies.get("sb-auth-token")?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user } } = await authClient.auth.getUser(accessToken);
  if (!user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { data: profile } = await authClient
    .from("mr_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const body = await req.json();
  const { email, fullName, role, region, password, managerId } = body;

  if (!email || !fullName || !role || !password) {
    return NextResponse.json(
      { error: "Missing required fields: email, fullName, role, password" },
      { status: 400 }
    );
  }

  const validRoles = ["MR", "MANAGER", "ADMIN"];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be MR, MANAGER, or ADMIN" },
      { status: 400 }
    );
  }

  // Verify we have the service_role key (not anon) - "user not allowed" happens when anon key is used
  try {
    const payload = JSON.parse(
      Buffer.from(supabaseServiceKey.split(".")[1], "base64").toString()
    );
    if (payload.role === "anon") {
      return NextResponse.json(
        {
          error:
            "Wrong API key: the anon key is configured. Use the service_role key from Supabase Dashboard → Settings → API → service_role (the secret one). Add as SUPABASE_SERVICE_ROLE_KEY in .env.local.",
        },
        { status: 500 }
      );
    }
  } catch {
    // Key format invalid, let Supabase handle it
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: newUser, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (authError) {
    const msg = authError.message;
    const hint =
      msg.toLowerCase().includes("user not allowed") ||
      msg.toLowerCase().includes("invalid api key")
        ? " Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local with the service_role key from Supabase Dashboard → Settings → API (not the anon key). Restart the dev server after changing env."
        : "";
    return NextResponse.json(
      { error: msg + hint },
      { status: 400 }
    );
  }

  const { error: profileError } = await adminClient
    .from("mr_profiles")
    .insert({
      id: newUser.user.id,
      full_name: fullName,
      email: newUser.user.email,
      role,
      region: region || null,
      manager_id: managerId || null,
    });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json(
      { error: "Failed to create MR profile: " + profileError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: newUser.user.id,
      email: newUser.user.email,
      fullName,
      role,
      region: region || null,
    },
    temporaryPassword: password,
  });
}
