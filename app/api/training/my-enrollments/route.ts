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

    // Fetch user's enrollments with program details (including student_id)
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("training_enrollments")
      .select(`
        *,
        training_programs (
          id,
          name,
          cohort_number,
          total_price,
          deposit_amount,
          start_date,
          end_date
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch enrollments" },
        { status: 500 }
      );
    }

    // Fetch payments for each enrollment
    const enrollmentsWithPayments = await Promise.all(
      (enrollments || []).map(async (enrollment) => {
        const { data: payments } = await supabase
          .from("training_payments")
          .select("*")
          .eq("enrollment_id", enrollment.id)
          .order("created_at", { ascending: true });

        return {
          ...enrollment,
          payments: payments || [],
        };
      })
    );

    return NextResponse.json({
      success: true,
      enrollments: enrollmentsWithPayments,
    });
  } catch (error: any) {
    console.error("Error in GET /api/training/my-enrollments:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

