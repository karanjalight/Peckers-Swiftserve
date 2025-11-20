import type { Metadata } from "next";
import { Inter , Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Peckers Services Ltd - Household Support & Corporate Productivity Solutions",
  description: "Peckers Services Ltd is Kenya's first fully integrated provider of Household Support and Corporate Productivity Solutions. We offer Backup Nannies, Pharma Training, and Performance Analytics. Trust, continuity, and world-class professionalism.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body
        className={`$${inter.variable} ${outfit.variable}}  antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
