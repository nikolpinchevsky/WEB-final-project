import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { ok: false, message: "NEXT_PUBLIC_API_URL is missing" },
        { status: 500 }
      );
    }

    const r = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await r.text();

    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { raw };
    }

    if (!r.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: data?.message || "Backend login failed",
          backendStatus: r.status,
          backendResponse: data,
        },
        { status: r.status }
      );
    }

    const res = NextResponse.json({ ok: true, data });

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
      {
        ok: false,
        message: "Login route crashed",
        error: String(error),
      },
      { status: 500 }
    );
  }
}