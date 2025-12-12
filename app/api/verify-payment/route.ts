import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  const { reference, orderId, requestId, type } = await req.json();

  try {
    // Verify with Paystack
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await res.json();

    if (data?.data?.status === "success") {
      // Payment verified successfully
      console.log("✅ Payment verified:", reference);

      // Handle nanny payment
      if (type === "nanny" && requestId) {
        const { error: updateError } = await supabase
          .from("nanny_payments")
          .update({
            status: "paid",
            mpesa_reference: reference,
            paid_at: new Date().toISOString(),
          })
          .eq("request_id", requestId);

        if (updateError) {
          console.error("Error updating nanny payment:", updateError);
          return NextResponse.json(
            { success: false, message: "Failed to update payment status", error: updateError },
            { status: 500 }
          );
        } else {
          // Update request payment status
          const { error: requestError } = await supabase
            .from("nanny_requests")
            .update({ is_paid: true })
            .eq("id", requestId);

          if (requestError) {
            console.error("Error updating nanny request:", requestError);
          }
        }
      }

      // Handle security payment
      if (type === "security" && requestId) {
        const { error: updateError } = await supabase
          .from("security_payments")
          .update({
            status: "paid",
            mpesa_reference: reference,
            paid_at: new Date().toISOString(),
          })
          .eq("request_id", requestId);

        if (updateError) {
          console.error("Error updating security payment:", updateError);
          return NextResponse.json(
            { success: false, message: "Failed to update payment status", error: updateError },
            { status: 500 }
          );
        } else {
          // Update request payment status
          const { error: requestError } = await supabase
            .from("security_requests")
            .update({ is_paid: true })
            .eq("id", requestId);

          if (requestError) {
            console.error("Error updating security request:", requestError);
          }
        }
      }

      // Handle order payment (existing functionality)
      if (orderId) {
        // Update order status to confirmed
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
          })
          .eq("id", orderId);

        await supabase
          .from("payments")
          .update({
            payment_method: "Paystack",
            payment_status: "Paid",
            transaction_ref: reference,
          })
          .eq("order_id", orderId);
      }

      return NextResponse.json({ 
        success: true, 
        data: data.data,
        orderId: orderId,
        requestId: requestId
      });
    } else {
      console.error("❌ Payment verification failed:", data);
      return NextResponse.json(
        { success: false, message: "Verification failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Verification error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during verification" },
      { status: 500 }
    );
  }
}