import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const r = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include"
  });

  const data = await r.json();

  const res = NextResponse.json({ ok: true, data });

  if (data.accessToken) {
    res.cookies.set("access_token", data.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/"
    });
  }

  if (data.refreshToken) {
    res.cookies.set("refresh_token", data.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/"
    });
  }

  return res;
}