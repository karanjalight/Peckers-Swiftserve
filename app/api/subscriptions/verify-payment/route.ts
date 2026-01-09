import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, subscription_id } = body;

    if (!reference || !subscription_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verificationData = await verifyResponse.json();

    if (
      verificationData.status &&
      verificationData.data.status === "success"
    ) {
      // Update subscription payment status
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          payment_status: "paid",
          payment_reference: reference,
          paid_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
          status: "active",
        })
        .eq("id", subscription_id);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      // Payment failed, update subscription
      await supabase
        .from("user_subscriptions")
        .update({
          payment_status: "failed",
          status: "cancelled",
        })
        .eq("id", subscription_id);

      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


















