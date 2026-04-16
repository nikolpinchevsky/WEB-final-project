import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { ok: false, message: "NEXT_PUBLIC_API_URL is missing" },
        { status: 500 }
      );
    }

    const cookieHeader = req.headers.get("cookie") || "";

    const r = await fetch(`${apiUrl}/trips`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    const raw = await r.text();

    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { raw };
    }

    return NextResponse.json(data, { status: r.status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Next /api/trips crashed",
        error: String(error),
      },
      { status: 500 }
    );
  }
}