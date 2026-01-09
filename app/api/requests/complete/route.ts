import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { requestId, type } = await req.json();

    if (!requestId || !type) {
      return NextResponse.json(
        { error: "Missing requestId or type" },
        { status: 400 }
      );
    }

    if (type !== "nanny" && type !== "security") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'nanny' or 'security'" },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Update request to completed
    const tableName = type === "nanny" ? "nanny_requests" : "security_requests";
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ is_completed: true })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating request:", updateError);
      return NextResponse.json(
        { error: "Failed to update request status" },
        { status: 500 }
      );
    }

    // For nanny requests, find and activate the assigned applicant
    if (type === "nanny") {
      // Find the applicant linked to this request via nanny_customer_selections
      const { data: selection, error: selectionError } = await supabase
        .from("nanny_customer_selections")
        .select("applicant_id")
        .eq("nanny_request_id", requestId)
        .maybeSingle();

      if (selectionError) {
        console.error("Error fetching selection:", selectionError);
        // Continue even if we can't find the selection
      } else if (selection?.applicant_id) {
        // Set applicant active = true
        const { error: applicantError } = await supabase
          .from("applicants")
          .update({ active: true })
          .eq("id", selection.applicant_id);

        if (applicantError) {
          console.error("Error updating applicant:", applicantError);
          // Continue even if we can't update the applicant
        }
      }

      // Also check nanny_assignments for nanny_id and update nannies table if needed
      const { data: assignment, error: assignmentError } = await supabase
        .from("nanny_assignments")
        .select("nanny_id")
        .eq("request_id", requestId)
        .eq("is_active", true)
        .maybeSingle();

      if (!assignmentError && assignment?.nanny_id) {
        // Update nanny status to available
        const { error: nannyError } = await supabase
          .from("nannies")
          .update({ status: "available" })
          .eq("id", assignment.nanny_id);

        if (nannyError) {
          console.error("Error updating nanny status:", nannyError);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Request marked as complete and applicant activated"
    });
  } catch (error) {
    console.error("Error in /api/requests/complete:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}









