import { NextResponse } from "next/server";

/**
 * SMS API Integration - Supports multiple providers
 * 
 * Set SMS_PROVIDER in .env.local to switch providers:
 * - "termii" (recommended - cheaper, easier)
 * - "africastalking" (default)
 * 
 * Termii Setup:
 * - TERMII_API_KEY: Your Termii API key
 * - TERMII_SENDER_ID: Your registered sender ID
 * 
 * Africa's Talking Setup:
 * - AFRICAS_TALKING_API_USERNAME: Your API username
 * - AFRICAS_TALKING_API_KEY: Your API key
 * - AFRICAS_TALKING_SENDER_ID: Your sender ID
 */

const SMS_PROVIDER = process.env.SMS_PROVIDER?.trim() || "africastalking";

// Trim whitespace from environment variables
const API_USERNAME = process.env.AFRICAS_TALKING_API_USERNAME?.trim();
const API_KEY = process.env.AFRICAS_TALKING_API_KEY?.trim();
const SENDER_ID = process.env.AFRICAS_TALKING_SENDER_ID?.trim() || "PECKERS";

// Termii credentials
const TERMII_API_KEY = process.env.TERMII_API_KEY?.trim();
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID?.trim() || "PECKERS";

// Log active SMS provider on module load (for debugging)
if (typeof window === "undefined") {
  // Server-side only
  const activeProvider = SMS_PROVIDER?.toLowerCase() === "termii" ? "Termii" : "Africa's Talking";
  console.log(`📱 SMS Service: ${activeProvider} is configured`);
  if (SMS_PROVIDER?.toLowerCase() === "termii") {
    console.log(`   ✓ TERMII_API_KEY: ${TERMII_API_KEY ? "Set (" + TERMII_API_KEY.length + " chars)" : "Missing"}`);
    console.log(`   ✓ TERMII_SENDER_ID: ${TERMII_SENDER_ID || "Not set"}`);
  } else {
    console.log(`   ✓ AFRICAS_TALKING_API_USERNAME: ${API_USERNAME || "Missing"}`);
    console.log(`   ✓ AFRICAS_TALKING_API_KEY: ${API_KEY ? "Set (" + API_KEY.length + " chars)" : "Missing"}`);
  }
}

export async function POST(req: Request) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    // Log which provider is being used
    console.log("📱 SMS Provider:", SMS_PROVIDER || "africastalking (default)");

    // Route to appropriate provider
    if (SMS_PROVIDER?.toLowerCase() === "termii") {
      console.log("✅ Routing to Termii SMS service");
      return await sendViaTermii(phone, message);
    } else {
      console.log("✅ Routing to Africa's Talking SMS service");
      return await sendViaAfricasTalking(phone, message);
    }
  } catch (error: any) {
    console.error("❌ SMS sending error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Termii SMS sending function
async function sendViaTermii(phone: string, message: string) {
  if (!TERMII_API_KEY) {
    console.error("❌ Termii API key not configured");
    console.error("TERMII_API_KEY:", TERMII_API_KEY ? "✓ Set" : "✗ Missing");
    console.error("TERMII_SENDER_ID:", TERMII_SENDER_ID ? "✓ Set (" + TERMII_SENDER_ID + ")" : "✗ Missing");
    return NextResponse.json(
      { success: false, error: "Termii SMS service not configured. Please add TERMII_API_KEY to .env.local" },
      { status: 500 }
    );
  }

  console.log("🔑 Termii credentials loaded:", {
    apiKeyLength: TERMII_API_KEY.length,
    apiKeyPreview: TERMII_API_KEY.substring(0, 8) + "..." + TERMII_API_KEY.substring(TERMII_API_KEY.length - 4),
    senderId: TERMII_SENDER_ID,
  });

  // Format phone number
  let formattedPhone = phone.replace(/\s+/g, "").replace(/\+/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "254" + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith("254")) {
    formattedPhone = "254" + formattedPhone;
  }

  const url = "https://api.termii.com/api/sms/send";
  
  // Termii requires sender ID to be registered and approved
  // If sender ID is not set or invalid, we'll try without it (some Termii accounts allow this)
  const requestBody: any = {
    to: formattedPhone,
    sms: message,
    type: "plain",
    channel: "generic",
    api_key: TERMII_API_KEY,
  };
  
  // Only add 'from' if sender ID is provided and not empty
  // Note: Sender ID must be registered in Termii dashboard
  if (TERMII_SENDER_ID && TERMII_SENDER_ID.trim() !== "") {
    requestBody.from = TERMII_SENDER_ID;
  }

  console.log("📤 Sending SMS via Termii:", {
    url,
    phone: formattedPhone,
    senderId: TERMII_SENDER_ID,
    messageLength: message.length,
  });

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

  // Check for success - Termii returns different formats
  const isSuccess = 
    response.ok && (
      data.message === "Successfully Sent" || 
      data.message === "Successfully sent" ||
      data.code === "ok" ||
      data.code === "200" ||
      (data.message_id && response.status === 200)
    );

  if (isSuccess) {
    console.log("✅ SMS sent successfully via Termii:", formattedPhone);
    return NextResponse.json({
      success: true,
      message: "SMS sent successfully",
      data: data,
    });
  } else {
    // Handle specific Termii errors
    let errorMessage = data.message || data.error || data.errorMessage || "Failed to send SMS";
    
    // Check for sender ID registration error - try without sender ID as fallback
    if ((errorMessage.includes("ApplicationSenderId not found") || errorMessage.includes("SenderId")) && TERMII_SENDER_ID && TERMII_SENDER_ID.trim() !== "") {
      console.warn("⚠️ Sender ID not registered, attempting to send without sender ID...");
      
      // Retry without sender ID
      const retryBody: any = {
        to: formattedPhone,
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: TERMII_API_KEY,
        // Explicitly omit 'from' field
      };
      
      console.log("🔄 Retrying SMS without sender ID...");
      
      const retryResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(retryBody),
      });
      
      const retryText = await retryResponse.text();
      let retryData: any;
      
      try {
        retryData = JSON.parse(retryText);
      } catch (parseError) {
        // If retry also fails, return original error with instructions
        errorMessage = `Sender ID "${TERMII_SENDER_ID}" is not registered. To fix this:\n\n1. Go to https://dashboard.termii.com\n2. Navigate to "Sender ID" section\n3. Register a new sender ID (e.g., "PECKERS")\n4. Wait for approval (usually instant)\n5. Update TERMII_SENDER_ID in .env.local with your approved sender ID\n\nOr check your dashboard for existing approved sender IDs and use one of those.`;
        console.error("❌ Termii Sender ID Error:", errorMessage);
        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: response.status || 500 }
        );
      }
      
      const retrySuccess = 
        retryResponse.ok && (
          retryData.message === "Successfully Sent" || 
          retryData.message === "Successfully sent" ||
          retryData.code === "ok" ||
          retryData.code === "200" ||
          (retryData.message_id && retryResponse.status === 200)
        );
      
      if (retrySuccess) {
        console.log("✅ SMS sent successfully via Termii (without sender ID):", formattedPhone);
        return NextResponse.json({
          success: true,
          message: "SMS sent successfully (without sender ID)",
          data: retryData,
        });
      } else {
        // Both attempts failed
        errorMessage = `Sender ID "${TERMII_SENDER_ID}" is not registered. To fix this:\n\n1. Go to https://dashboard.termii.com\n2. Navigate to "Sender ID" section\n3. Register a new sender ID (e.g., "PECKERS")\n4. Wait for approval (usually instant)\n5. Update TERMII_SENDER_ID in .env.local with your approved sender ID\n\nOr check your dashboard for existing approved sender IDs and use one of those.`;
        console.error("❌ Termii Sender ID Error (both attempts failed):", errorMessage);
        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: response.status || 500 }
        );
      }
    } else {
      console.error("❌ Termii API error:", errorMessage, data);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status || 500 }
      );
    }
  }
}

// Africa's Talking SMS sending function
async function sendViaAfricasTalking(phone: string, message: string) {
  // Validate environment variables
  if (!API_USERNAME || !API_KEY) {
    console.error("❌ Africa's Talking credentials not configured");
    console.error("API_USERNAME:", API_USERNAME ? "✓ Set" : "✗ Missing");
    console.error("API_KEY:", API_KEY ? "✓ Set (length: " + API_KEY.length + ")" : "✗ Missing");
    return NextResponse.json(
      { success: false, error: "SMS service not configured. Please check your .env.local file." },
      { status: 500 }
    );
  }

    // Debug: Check if API key looks valid (should be a long string)
    if (API_KEY.length < 10) {
      console.warn("⚠️ API_KEY seems too short. Expected a longer key from Africa's Talking.");
    }

    // Format phone number (remove + and ensure it starts with country code)
    // Kenya format: +254XXXXXXXXX -> 254XXXXXXXXX
    let formattedPhone = phone.replace(/\s+/g, "").replace(/\+/g, "");
    if (formattedPhone.startsWith("0")) {
      // Convert 07XXXXXXXX to 2547XXXXXXXX
      formattedPhone = "254" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("254")) {
      // If it doesn't start with 254, add it
      formattedPhone = "254" + formattedPhone;
    }

    // Africa's Talking SMS API endpoint
    // Use sandbox endpoint for sandbox credentials, production for production
    const isSandbox = API_USERNAME?.toLowerCase() === "sandbox";
    const url = isSandbox 
      ? "https://api.sandbox.africastalking.com/version1/messaging"
      : "https://api.africastalking.com/version1/messaging";
    
    console.log("🌐 Using API endpoint:", url, isSandbox ? "(Sandbox)" : "(Production)");

    // Create Basic Auth header - verify the format
    const credentials = `${API_USERNAME}:${API_KEY}`;
    const auth = Buffer.from(credentials).toString("base64");
    
    // Debug: Show first/last chars of API key (masked for security)
    const apiKeyPreview = API_KEY.length > 10 
      ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`
      : "***";
    
    // Verify the Basic Auth encoding (decode to check)
    const decodedAuth = Buffer.from(auth, "base64").toString("utf-8");
    console.log("🔍 Auth verification:", {
      credentialsFormat: `${API_USERNAME}:${apiKeyPreview}`,
      decodedMatches: decodedAuth === credentials ? "✓" : "✗",
      decodedAuth: decodedAuth.substring(0, 20) + "...",
    });

    // Prepare request body
    const formData = new URLSearchParams();
    formData.append("username", API_USERNAME);
    formData.append("to", formattedPhone);
    formData.append("message", message);
    
    // For sandbox, sender ID should be "AFRICASTKNG" or omitted
    // For production, use your registered sender ID
    if (isSandbox) {
      // Sandbox requires "AFRICASTKNG" or can be omitted
      if (SENDER_ID && SENDER_ID.trim() !== "" && SENDER_ID.trim().toUpperCase() !== "AFRICASTKNG") {
        console.log("⚠️ Sandbox detected: Using 'AFRICASTKNG' as sender ID instead of", SENDER_ID);
        formData.append("from", "AFRICASTKNG");
      } else if (SENDER_ID && SENDER_ID.trim().toUpperCase() === "AFRICASTKNG") {
        formData.append("from", "AFRICASTKNG");
      }
      // If SENDER_ID is empty or not set, omit 'from' parameter for sandbox
    } else {
      // Production: use the provided sender ID
      if (SENDER_ID && SENDER_ID.trim() !== "") {
        formData.append("from", SENDER_ID);
      }
    }

    // Debug logging (remove in production or make conditional)
    console.log("📤 Sending SMS request:", {
      url,
      username: API_USERNAME,
      phone: formattedPhone,
      senderId: SENDER_ID,
      messageLength: message.length,
      apiKeyLength: API_KEY.length,
      apiKeyPreview: apiKeyPreview,
      authHeaderLength: auth.length,
      authHeaderPreview: auth.substring(0, 20) + "...",
    });
    
    // Log the actual request body being sent
    console.log("📋 Request body:", formData.toString());

    // Send SMS
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: formData.toString(),
    });

    // Get response text first to handle both JSON and non-JSON responses
    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // If response is not JSON, log the actual response
      console.error("❌ Non-JSON response from Africa's Talking API:", responseText.substring(0, 200));
      console.error("Response status:", response.status);
      console.error("Response headers:", Object.fromEntries(response.headers.entries()));
      
      // Provide helpful error message for 401
      if (response.status === 401) {
        console.error("🔐 Authentication Failed - Possible issues:");
        console.error("  1. API key might be incorrect or expired");
        console.error("  2. Username might be wrong (should be 'sandbox' for sandbox)");
        console.error("  3. API key might have extra spaces or special characters");
        console.error("  4. You might be using production key instead of sandbox key");
        console.error("  5. API key might need to be regenerated in dashboard");
        
        return NextResponse.json(
          { 
            success: false, 
            error: `Authentication failed (401). Please verify your API credentials in .env.local. Check: 1) API key is correct, 2) Username is 'sandbox' for sandbox, 3) No extra spaces in credentials, 4) Using sandbox key (not production). See server logs for details.` 
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `API returned non-JSON response. Status: ${response.status}. Check server logs for details.` 
        },
        { status: response.status || 500 }
      );
    }

    // Log the full response for debugging
    console.log("Africa's Talking API Response:", JSON.stringify(data, null, 2));

    if (response.ok && data.SMSMessageData) {
      const recipients = data.SMSMessageData.Recipients || [];
      const success = recipients.some((r: any) => r.statusCode === 101);

      if (success) {
        console.log("✅ SMS sent successfully:", formattedPhone);
        return NextResponse.json({
          success: true,
          message: "SMS sent successfully",
          data: data.SMSMessageData,
        });
      } else {
        const error = recipients[0]?.status || recipients[0]?.statusMessage || "Unknown error";
        console.error("❌ SMS failed:", error, recipients);
        return NextResponse.json(
          { success: false, error: `SMS failed: ${error}` },
          { status: 400 }
        );
      }
    } else {
      console.error("❌ Africa's Talking API error:", data);
      const errorMessage = data.errorMessage || data.message || data.error || "Failed to send SMS";
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status || 500 }
      );
    }
}

