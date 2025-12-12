import { NextResponse } from "next/server";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();

// Generate plain text version of email for better deliverability
function generatePlainText(html: string, customerName?: string, amount?: number, paymentLink?: string): string {
  // Simple text extraction - remove HTML tags and format nicely
  let text = html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // If we have structured data, create a better text version
  if (customerName && amount && paymentLink) {
    return `Hello ${customerName},

Your service quote is ready!

Quotation Amount: Ksh ${amount.toLocaleString()}

To complete your payment, please visit:
${paymentLink}

If you have any questions, please contact us at your convenience.

Thank you for choosing Peckers Swiftserve!`;
  }

  return text;
}

// Initialize Resend client
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const { to, subject, html, customerName, amount, paymentLink, serviceType } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: "Email address, subject, and HTML content are required" },
        { status: 400 }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("❌ Resend API key not configured");
      return NextResponse.json(
        { success: false, error: "Email service not configured. Please add RESEND_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    if (!resend) {
      return NextResponse.json(
        { success: false, error: "Resend client not initialized" },
        { status: 500 }
      );
    }

    // Get the from email from environment or use default
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
    const fromName = process.env.RESEND_FROM_NAME?.trim() || "Peckers Swiftserve";

    console.log("📧 Sending email via Resend:", {
      to,
      from: `${fromName} <${fromEmail}>`,
      subject,
      hasPaymentLink: !!paymentLink,
      hasAmount: !!amount,
    });

    // Generate plain text version from HTML for better deliverability
    const textVersion = generatePlainText(html, customerName, amount, paymentLink);

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
      text: textVersion,
      // Add reply-to for better deliverability
      reply_to: process.env.RESEND_REPLY_TO?.trim() || fromEmail,
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Failed to send email" },
        { status: 500 }
      );
    }

    console.log("✅ Email sent successfully via Resend:", data?.id);
    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      data: data,
    });
  } catch (error: any) {
    console.error("❌ Email sending error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

