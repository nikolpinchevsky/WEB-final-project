import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { ok: false, message: "NEXT_PUBLIC_API_URL is missing" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers["Cookie"] = `access_token=${accessToken}`;
    }

    const r = await fetch(`${apiUrl}/trips`, {
      method: "GET",
      headers,
      cache: "no-store",
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
          message: data?.message || "Backend trips failed",
          backendStatus: r.status,
          backendResponse: data,
        },
        { status: r.status }
      );
    }

    return NextResponse.json(data);
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