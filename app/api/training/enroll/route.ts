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

    const { programId } = await req.json();

    if (!programId) {
      return NextResponse.json(
        { success: false, error: "Program ID is required" },
        { status: 400 }
      );
    }

    // Check if program exists and is available
    const { data: program, error: programError } = await supabase
      .from("training_programs")
      .select("*")
      .eq("id", programId)
      .eq("is_active", true)
      .eq("is_published", true)
      .single();

    if (programError || !program) {
      return NextResponse.json(
        { success: false, error: "Program not found or not available" },
        { status: 404 }
      );
    }

    // Check if program has space
    if (program.max_participants && program.current_participants >= program.max_participants) {
      return NextResponse.json(
        { success: false, error: "Program is full" },
        { status: 400 }
      );
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await supabase
      .from("training_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("program_id", programId)
      .single();

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: "You are already enrolled in this program" },
        { status: 400 }
      );
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("training_enrollments")
      .insert([
        {
          user_id: user.id,
          program_id: programId,
          enrollment_status: "pending",
        },
      ])
      .select()
      .single();

    if (enrollmentError) {
      console.error("Error creating enrollment:", enrollmentError);
      return NextResponse.json(
        { success: false, error: "Failed to create enrollment" },
        { status: 500 }
      );
    }

    // Create deposit payment record
    const { data: payment, error: paymentError } = await supabase
      .from("training_payments")
      .insert([
        {
          enrollment_id: enrollment.id,
          user_id: user.id,
          program_id: programId,
          payment_type: "deposit",
          amount: program.deposit_amount,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      // Rollback enrollment if payment creation fails
      await supabase.from("training_enrollments").delete().eq("id", enrollment.id);
      return NextResponse.json(
        { success: false, error: "Failed to create payment record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollment,
      payment,
      depositAmount: program.deposit_amount,
    });
  } catch (error: any) {
    console.error("Error in POST /api/training/enroll:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

