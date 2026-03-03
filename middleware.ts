import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log("═══ MIDDLEWARE RUN ═══");
  console.log("Pathname:", pathname);

  // Get the Supabase session from cookies
  const supabaseSession = req.cookies.get("sb-auth-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;

  console.log("Supabase session exists:", !!supabaseSession);
  console.log("Refresh token exists:", !!refreshToken);

  // MR routes: /mr/login is public, rest require auth
  if (pathname.startsWith("/mr") && !pathname.startsWith("/mr/login")) {
    if (!supabaseSession) {
      return NextResponse.redirect(new URL("/mr/login", req.url));
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(supabaseSession);

      if (error || !user) {
        console.log("❌ MR INVALID SESSION - Redirecting to /mr/login");
        return NextResponse.redirect(new URL("/mr/login", req.url));
      }

      console.log("✅ MR SESSION VALID - allowing");
      return NextResponse.next();
    } catch (err: any) {
      console.log("❌ MR SESSION CHECK FAILED:", err?.message);
      return NextResponse.redirect(new URL("/mr/login", req.url));
    }
  }

  // Protected routes that require authentication
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account")
  ) {
    console.log("🔐 Protected route detected");

    // If no session, redirect to login
    if (!supabaseSession) {
      console.log("❌ NO SESSION - Redirecting to /login");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(supabaseSession);

      if (error || !user) {
        console.log("❌ INVALID SESSION - Redirecting to /login");
        return NextResponse.redirect(new URL("/login", req.url));
      }

      console.log("✅ SESSION VALID - User authenticated");
      console.log("✅ ALLOWING ACCESS");
      return NextResponse.next();
    } catch (err: any) {
      console.log("❌ SESSION VERIFICATION FAILED:", err?.message);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Allow public routes (login, signup, etc.)
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    console.log("✅ Public route - allowing");
    return NextResponse.next();
  }

  console.log("✅ Non-protected route - allowing");
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/account/:path*",
    "/mr/:path*",
    "/login/:path*",
    "/signup/:path*",
  ],
};