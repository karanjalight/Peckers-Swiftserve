import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    // Get the access token from cookies
    const accessToken = req.cookies.get("sb-auth-token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
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
        { success: false, error: "Authentication failed" },
        { status: 401 }
      );
    }

    const { enrollmentId, amount } = await req.json();

    if (!enrollmentId || !amount) {
      return NextResponse.json(
        { success: false, error: "Enrollment ID and amount are required" },
        { status: 400 }
      );
    }

    // Verify enrollment belongs to user and deposit is paid
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("training_enrollments")
      .select(`
        *,
        training_programs (*)
      `)
      .eq("id", enrollmentId)
      .eq("user_id", user.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { success: false, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    if (enrollment.enrollment_status !== "deposit_paid") {
      return NextResponse.json(
        { success: false, error: "Deposit must be paid before paying balance" },
        { status: 400 }
      );
    }

    // Check if balance payment already exists
    const { data: existingPayment } = await supabase
      .from("training_payments")
      .select("id")
      .eq("enrollment_id", enrollmentId)
      .eq("payment_type", "balance")
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { success: false, error: "Balance payment already exists" },
        { status: 400 }
      );
    }

    // Create balance payment record
    const { data: payment, error: paymentError } = await supabase
      .from("training_payments")
      .insert([
        {
          enrollment_id: enrollmentId,
          user_id: user.id,
          program_id: enrollment.training_programs.id,
          payment_type: "balance",
          amount: amount,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating balance payment:", paymentError);
      return NextResponse.json(
        { success: false, error: "Failed to create payment record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error: any) {
    console.error("Error in POST /api/training/create-balance-payment:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

