import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/planner", "/history"]; 
const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const access = req.cookies.get("access_token")?.value;

  if (!access) {
    const refreshed = await tryRefresh(req);
    if (refreshed) return refreshed;
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

async function tryRefresh(req: NextRequest) {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { cookie: req.headers.get("cookie") || "" },
      credentials: "include",
    });

    if (!res.ok) return null;

    const nextRes = NextResponse.next();
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) nextRes.headers.set("set-cookie", setCookie);
    return nextRes;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/planner/:path*", "/history/:path*"],
};