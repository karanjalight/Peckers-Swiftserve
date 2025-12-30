import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  try {
    // Get the access token from cookies
    const accessToken = req.cookies.get("sb-auth-token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Create a Supabase client with the access token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Get the user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // Fetch user data from the users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Build query conditions for nanny requests
    const nannyConditions = [`user_id.eq.${user.id}`, `email.eq.${userData.email}`];
    if (userData.phone) {
      nannyConditions.push(`phone.eq.${userData.phone}`);
    }

    // Fetch nanny requests (by user_id, email, or phone)
    const { data: nannyData, error: nannyError } = await supabase
      .from("nanny_requests")
      .select("*")
      .or(nannyConditions.join(","))
      .order("created_at", { ascending: false });

    if (nannyError) {
      console.error("Error fetching nanny requests:", nannyError);
    }

    // Build query conditions for security requests
    const securityConditions = [`user_id.eq.${user.id}`, `email.eq.${userData.email}`];
    if (userData.phone) {
      securityConditions.push(`phone.eq.${userData.phone}`);
    }

    // Fetch security requests (by user_id, email, or phone)
    const { data: securityData, error: securityError } = await supabase
      .from("security_requests")
      .select("*")
      .or(securityConditions.join(","))
      .order("created_at", { ascending: false });

    if (securityError) {
      console.error("Error fetching security requests:", securityError);
    }

    // Fetch nanny payments by user_id
    const { data: nannyPaymentsByUser, error: nannyPayUserError } = await supabase
      .from("nanny_payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Also fetch nanny payments by request_id (in case some don't have user_id set)
    const nannyRequestIds = nannyData?.map(r => r.id) || [];
    let nannyPaymentsByRequest: any[] = [];
    if (nannyRequestIds.length > 0) {
      const { data: nannyPaymentsByReq, error: nannyPayReqError } = await supabase
        .from("nanny_payments")
        .select("*")
        .in("request_id", nannyRequestIds)
        .order("created_at", { ascending: false });
      
      if (!nannyPayReqError && nannyPaymentsByReq) {
        nannyPaymentsByRequest = nannyPaymentsByReq;
      }
    }

    // Combine and deduplicate nanny payments
    const allNannyPayments = [
      ...(nannyPaymentsByUser || []),
      ...nannyPaymentsByRequest,
    ];
    const uniqueNannyPayments = Array.from(
      new Map(allNannyPayments.map(p => [p.id, p])).values()
    );

    if (nannyPayUserError) {
      console.error("Error fetching nanny payments:", nannyPayUserError);
    }

    // Fetch security payments by user_id
    const { data: securityPaymentsByUser, error: securityPayUserError } = await supabase
      .from("security_payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Also fetch security payments by request_id (in case some don't have user_id set)
    const securityRequestIds = securityData?.map(r => r.id) || [];
    let securityPaymentsByRequest: any[] = [];
    if (securityRequestIds.length > 0) {
      const { data: securityPaymentsByReq, error: securityPayReqError } = await supabase
        .from("security_payments")
        .select("*")
        .in("request_id", securityRequestIds)
        .order("created_at", { ascending: false });
      
      if (!securityPayReqError && securityPaymentsByReq) {
        securityPaymentsByRequest = securityPaymentsByReq;
      }
    }

    // Combine and deduplicate security payments
    const allSecurityPayments = [
      ...(securityPaymentsByUser || []),
      ...securityPaymentsByRequest,
    ];
    const uniqueSecurityPayments = Array.from(
      new Map(allSecurityPayments.map(p => [p.id, p])).values()
    );

    if (securityPayUserError) {
      console.error("Error fetching security payments:", securityPayUserError);
    }

    // Combine payments
    const allPayments = [
      ...uniqueNannyPayments.map((p: any) => ({ ...p, type: "nanny" as const })),
      ...uniqueSecurityPayments.map((p: any) => ({ ...p, type: "security" as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Fetch user subscriptions
    const { data: subscriptionsData, error: subscriptionsError } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_packages (
          name,
          service_type,
          service_days,
          validity_days
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (subscriptionsError) {
      console.error("Error fetching subscriptions:", subscriptionsError);
    }

    // Fetch subscription redemptions
    const { data: redemptionsData, error: redemptionsError } = await supabase
      .from("subscription_redemptions")
      .select(`
        *,
        user_subscriptions (
          subscription_packages (
            name,
            service_type
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (redemptionsError) {
      console.error("Error fetching redemptions:", redemptionsError);
    }

    return NextResponse.json({
      user: userData,
      nannyRequests: nannyData || [],
      securityRequests: securityData || [],
      payments: allPayments,
      subscriptions: subscriptionsData || [],
      redemptions: redemptionsData || [],
    });
  } catch (error) {
    console.error("Error in /api/account/data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

