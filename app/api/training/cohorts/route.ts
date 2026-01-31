import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  try {
    // Fetch active and published training programs
    const { data: programs, error } = await supabase
      .from("training_programs")
      .select("*")
      .eq("is_active", true)
      .eq("is_published", true)
      .order("cohort_number", { ascending: false }); // Latest cohorts first

    if (error) {
      console.error("Error fetching training programs:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, programs: programs || [] });
  } catch (error: any) {
    console.error("Error in GET /api/training/cohorts:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}





