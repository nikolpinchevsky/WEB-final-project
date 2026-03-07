import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await r.json();

    if (!r.ok) {
      return NextResponse.json(data, { status: r.status });
    }

    const res = NextResponse.json({ ok: true });

    if (data.accessToken) {
      res.cookies.set("accessToken", data.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return res;
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Login failed", error: String(error) },
      { status: 500 }
    );
  }
}