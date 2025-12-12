import { NextResponse } from "next/server";

/**
 * Termii SMS API Integration (Alternative to Africa's Talking)
 * 
 * Required Environment Variables:
 * - TERMII_API_KEY: Your Termii API key
 * - TERMII_SENDER_ID: Your registered sender ID (e.g., "Peckers" or "PECKERS")
 * 
 * Sign up at: https://termii.com
 * Get API key from: https://dashboard.termii.com/#/settings
 * 
 * Pricing: ~KES 0.50-1.00 per SMS (cheaper than Africa's Talking)
 */

const TERMII_API_KEY = process.env.TERMII_API_KEY?.trim();
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID?.trim() || "Peckers";

export async function POST(req: Request) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!TERMII_API_KEY) {
      console.error("❌ Termii API key not configured");
      return NextResponse.json(
        { success: false, error: "SMS service not configured. Please add TERMII_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    // Format phone number (Termii expects international format without +)
    // Kenya format: +254XXXXXXXXX -> 254XXXXXXXXX
    let formattedPhone = phone.replace(/\s+/g, "").replace(/\+/g, "");
    if (formattedPhone.startsWith("0")) {
      // Convert 07XXXXXXXX to 2547XXXXXXXX
      formattedPhone = "254" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("254")) {
      // If it doesn't start with 254, add it
      formattedPhone = "254" + formattedPhone;
    }

    // Termii SMS API endpoint
    const url = "https://api.termii.com/api/sms/send";

    // Prepare request body
    const requestBody = {
      to: formattedPhone,
      from: TERMII_SENDER_ID,
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: TERMII_API_KEY,
    };

    console.log("📤 Sending SMS via Termii:", {
      url,
      phone: formattedPhone,
      senderId: TERMII_SENDER_ID,
      messageLength: message.length,
      apiKeyLength: TERMII_API_KEY.length,
    });

    // Send SMS
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Non-JSON response from Termii API:", responseText.substring(0, 200));
      return NextResponse.json(
        { 
          success: false, 
          error: `API returned non-JSON response. Status: ${response.status}. Response: ${responseText.substring(0, 100)}` 
        },
        { status: response.status || 500 }
      );
    }

    console.log("Termii API Response:", JSON.stringify(data, null, 2));

    if (response.ok && data.message === "Successfully Sent") {
      console.log("✅ SMS sent successfully via Termii:", formattedPhone);
      return NextResponse.json({
        success: true,
        message: "SMS sent successfully",
        data: data,
      });
    } else {
      const errorMessage = data.message || data.error || "Failed to send SMS";
      console.error("❌ Termii API error:", errorMessage, data);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status || 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ SMS sending error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

