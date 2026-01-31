"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Copy,
  Share2,
  Download,
  Check,
  X,
  Loader2,
  Mail,
  Key,
  User,
  ExternalLink,
} from "lucide-react";

interface CredentialsCardProps {
  email: string;
  fullName: string;
  role: string;
  temporaryPassword: string;
  onClose: () => void;
}

function getCredentialsText(
  email: string,
  fullName: string,
  role: string,
  temporaryPassword: string
) {
  const loginUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/mr/login`
      : "https://yoursite.com/mr/login";
  return `MR Field Intelligence - Login Credentials

Name: ${fullName}
Role: ${role}
Email: ${email}
Password: ${temporaryPassword}

Login URL: ${loginUrl}

Please save these credentials securely. Change your password after first login if possible.`;
}

export function CredentialsCard({
  email,
  fullName,
  role,
  temporaryPassword,
  onClose,
}: CredentialsCardProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const credentialsText = getCredentialsText(
    email,
    fullName,
    role,
    temporaryPassword
  );

  const loginUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/mr/login`
      : "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(credentialsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy to clipboard");
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "MR Field Intelligence - Login Credentials",
          text: credentialsText,
          url: loginUrl,
        });
      } else {
        await navigator.clipboard.writeText(credentialsText);
        alert("Credentials copied to clipboard (Share not supported on this device)");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(credentialsText);
        alert("Credentials copied to clipboard instead");
      }
    } finally {
      setSharing(false);
    }
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a5" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 25;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("MR Field Intelligence", pageW / 2, y, { align: "center" });
      y += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Login Credentials", pageW / 2, y, { align: "center" });
      y += 15;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 12;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Name:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(fullName, margin + 30, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.text("Role:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(role, margin + 30, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.text("Email:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(email, margin + 30, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.text("Password:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 0, 0);
      doc.text(temporaryPassword, margin + 35, y);
      doc.setTextColor(0, 0, 0);
      y += 15;

      doc.setFont("helvetica", "bold");
      doc.text("Login URL:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(loginUrl, margin, y + 6);
      y += 18;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Save these credentials securely. Share only through secure channels.",
        margin,
        y
      );
      doc.setTextColor(0, 0, 0);

      const filename = `MR-Credentials-${fullName.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-emerald-800">
              <User className="h-5 w-5" />
              Account Created
            </CardTitle>
            <CardDescription>
              Share these credentials with the user. They can log in at{" "}
              <a
                href={loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
              >
                /mr/login
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-white p-4 font-mono text-sm">
          <div className="mb-3 flex items-center gap-2 text-slate-500">
            <Mail className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Email</span>
          </div>
          <p className="break-all font-medium text-slate-900">{email}</p>

          <div className="mt-4 mb-3 flex items-center gap-2 text-slate-500">
            <Key className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Temporary Password</span>
          </div>
          <p className="font-mono font-semibold text-red-600">{temporaryPassword}</p>

          <div className="mt-3 text-xs text-slate-500">
            Role: <span className="font-medium text-slate-700">{role}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1 sm:flex-none"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 sm:flex-none"
          >
            {sharing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="mr-2 h-4 w-4" />
            )}
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex-1 sm:flex-none"
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
