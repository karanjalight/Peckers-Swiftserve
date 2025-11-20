import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { reference, orderId } = await req.json();

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
      return NextResponse.json({ 
        success: true, 
        data: data.data,
        orderId: orderId 
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