"use client";

import React, { useState } from "react";

export default function SmsTestPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      // Process phone numbers: handle both comma-separated and newline-separated
      const phoneNumbers = phoneNumber
        .split(/[,\n]/)
        .map(num => num.trim())
        .filter(num => num.length > 0);
      
      // Use the existing SMS API route that supports Africa's Talking
      // API accepts array or comma-separated string
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phone: phoneNumbers.length > 1 ? phoneNumbers : phoneNumbers[0], 
          message: message 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const recipientCount = data.data?.totalRecipients || 1;
        const successCount = data.data?.successful || recipientCount;
        const isBulk = data.data?.isBulk || false;
        
        let successMessage = "SMS sent successfully!";
        if (isBulk) {
          successMessage = `SMS sent to ${successCount} of ${recipientCount} recipient${recipientCount > 1 ? 's' : ''} successfully!`;
        }
        
        setStatus({ 
          type: "success", 
          message: successMessage
        });
        // Clear form on success
        setPhoneNumber("");
        setMessage("");
      } else {
        setStatus({ 
          type: "error", 
          message: data.message || data.error || "Failed to send SMS. Please check your credentials." 
        });
      }
    } catch (error: any) {
      setStatus({ 
        type: "error", 
        message: `An error occurred: ${error.message || "Network error"}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ 
      maxWidth: 600, 
      margin: "60px auto", 
      padding: "40px 24px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        padding: "32px"
      }}>
        <h1 style={{ 
          marginTop: 0, 
          marginBottom: "8px",
          fontSize: "28px",
          fontWeight: "600",
          color: "#1a1a1a"
        }}>
          SMS Test - Africa's Talking
        </h1>
        <p style={{ 
          color: "#666", 
          marginBottom: "32px",
          fontSize: "14px"
        }}>
          Test sending SMS messages using Africa's Talking API
        </p>

        <form onSubmit={handleSendSms}>
          <div style={{ marginBottom: "24px" }}>
            <label 
              htmlFor="phoneNumber"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
                color: "#333",
                fontSize: "14px"
              }}
            >
              Phone Number(s)
            </label>
            <textarea
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., +254712345678, +254798765432&#10;Or separate on new lines:&#10;+254712345678&#10;+254798765432"
              required
              disabled={loading}
              rows={3}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "inherit",
                transition: "border-color 0.2s",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#0070f3"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
            <small style={{ 
              display: "block", 
              marginTop: "4px", 
              color: "#888",
              fontSize: "12px"
            }}>
              {(() => {
                const numbers = phoneNumber.split(/[,\n]/).filter(n => n.trim()).length;
                return numbers > 0 
                  ? `${numbers} recipient${numbers > 1 ? 's' : ''} - Separate multiple numbers with commas or new lines`
                  : "Format: +254XXXXXXXXX or 0XXXXXXXXX (Kenya). Separate multiple numbers with commas or new lines";
              })()}
            </small>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label 
              htmlFor="message"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
                color: "#333",
                fontSize: "14px"
              }}
            >
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your SMS message here..."
              required
              disabled={loading}
              rows={6}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "inherit",
                transition: "border-color 0.2s",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#0070f3"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
            <small style={{ 
              display: "block", 
              marginTop: "4px", 
              color: "#888",
              fontSize: "12px"
            }}>
              {message.length} characters (SMS limit: 160 characters per message)
            </small>
          </div>

          {status && (
            <div style={{
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "24px",
              backgroundColor: status.type === "success" ? "#d4edda" : "#f8d7da",
              color: status.type === "success" ? "#155724" : "#721c24",
              border: `1px solid ${status.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
              fontSize: "14px"
            }}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phoneNumber || !message}
            style={{
              width: "100%",
              padding: "14px 24px",
              fontSize: "16px",
              fontWeight: "600",
              color: "#fff",
              backgroundColor: loading ? "#999" : "#0070f3",
              border: "none",
              borderRadius: "8px",
              cursor: loading || !phoneNumber || !message ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
              opacity: loading || !phoneNumber || !message ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && phoneNumber && message) {
                e.currentTarget.style.backgroundColor = "#0051cc";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && phoneNumber && message) {
                e.currentTarget.style.backgroundColor = "#0070f3";
              }
            }}
          >
            {loading ? "Sending..." : "Send SMS"}
          </button>
        </form>

        <div style={{
          marginTop: "32px",
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          fontSize: "13px",
          color: "#666"
        }}>
          <strong style={{ display: "block", marginBottom: "8px", color: "#333" }}>
            Note:
          </strong>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            <li>Make sure your Africa's Talking credentials are configured in <code>.env.local</code></li>
            <li>Required: AFRICAS_TALKING_API_USERNAME, AFRICAS_TALKING_API_KEY</li>
            <li>Optional: AFRICAS_TALKING_SENDER_ID (omit in sandbox mode)</li>
            <li>For testing, use sandbox credentials (username: "sandbox")</li>
            <li>Phone numbers will be automatically formatted to international format</li>
            <li><strong>Send to multiple numbers:</strong> Separate with commas or new lines</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
