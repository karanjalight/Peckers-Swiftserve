import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const base = req.nextUrl.origin;
  const response = NextResponse.redirect(new URL("/mr/login", base));
  
  response.cookies.set("sb-auth-token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("sb-refresh-token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}
