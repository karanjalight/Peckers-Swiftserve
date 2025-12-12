import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId, email, phone } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: "Email or phone is required" },
        { status: 400 }
      );
    }

    let linkedCount = 0;

    // Link nanny requests by email
    if (email) {
      const { data: nannyByEmail, error: nannyEmailError } = await supabase
        .from("nanny_requests")
        .update({ user_id: userId })
        .eq("email", email)
        .is("user_id", null)
        .select("id");

      if (!nannyEmailError && nannyByEmail) {
        linkedCount += nannyByEmail.length;
      }
    }

    // Link nanny requests by phone
    if (phone) {
      const { data: nannyByPhone, error: nannyPhoneError } = await supabase
        .from("nanny_requests")
        .update({ user_id: userId })
        .eq("phone", phone)
        .is("user_id", null)
        .select("id");

      if (!nannyPhoneError && nannyByPhone) {
        linkedCount += nannyByPhone.length;
      }
    }

    // Link security requests by email
    if (email) {
      const { data: securityByEmail, error: securityEmailError } = await supabase
        .from("security_requests")
        .update({ user_id: userId })
        .eq("email", email)
        .is("user_id", null)
        .select("id");

      if (!securityEmailError && securityByEmail) {
        linkedCount += securityByEmail.length;
      }
    }

    // Link security requests by phone
    if (phone) {
      const { data: securityByPhone, error: securityPhoneError } = await supabase
        .from("security_requests")
        .update({ user_id: userId })
        .eq("phone", phone)
        .is("user_id", null)
        .select("id");

      if (!securityPhoneError && securityByPhone) {
        linkedCount += securityByPhone.length;
      }
    }

    // Link payments - first get all request IDs that were just linked
    const requestIds: string[] = [];

    if (email) {
      const { data: nannyRequests } = await supabase
        .from("nanny_requests")
        .select("id")
        .eq("email", email)
        .eq("user_id", userId);

      const { data: securityRequests } = await supabase
        .from("security_requests")
        .select("id")
        .eq("email", email)
        .eq("user_id", userId);

      if (nannyRequests) requestIds.push(...nannyRequests.map((r) => r.id));
      if (securityRequests) requestIds.push(...securityRequests.map((r) => r.id));
    }

    if (phone) {
      const { data: nannyRequests } = await supabase
        .from("nanny_requests")
        .select("id")
        .eq("phone", phone)
        .eq("user_id", userId);

      const { data: securityRequests } = await supabase
        .from("security_requests")
        .select("id")
        .eq("phone", phone)
        .eq("user_id", userId);

      if (nannyRequests) {
        nannyRequests.forEach((r) => {
          if (!requestIds.includes(r.id)) requestIds.push(r.id);
        });
      }
      if (securityRequests) {
        securityRequests.forEach((r) => {
          if (!requestIds.includes(r.id)) requestIds.push(r.id);
        });
      }
    }

    // Link nanny payments
    if (requestIds.length > 0) {
      const nannyRequestIds = await supabase
        .from("nanny_requests")
        .select("id")
        .in("id", requestIds);

      if (nannyRequestIds.data && nannyRequestIds.data.length > 0) {
        const nannyIds = nannyRequestIds.data.map((r) => r.id);
        await supabase
          .from("nanny_payments")
          .update({ user_id: userId })
          .in("request_id", nannyIds)
          .is("user_id", null);
      }

      // Link security payments
      const securityRequestIds = await supabase
        .from("security_requests")
        .select("id")
        .in("id", requestIds);

      if (securityRequestIds.data && securityRequestIds.data.length > 0) {
        const securityIds = securityRequestIds.data.map((r) => r.id);
        await supabase
          .from("security_payments")
          .update({ user_id: userId })
          .in("request_id", securityIds)
          .is("user_id", null);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Linked ${linkedCount} requests to your account`,
      linkedCount,
    });
  } catch (error: any) {
    console.error("Error linking requests:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

