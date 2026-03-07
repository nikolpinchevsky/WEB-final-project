import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
      "http://localhost:4000";

    const upstreamUrl = `${base}/trips/save`;

    const cookie = req.headers.get("cookie") || "";

    const r = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": r.headers.get("content-type") || "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Next /api/trips/save crashed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}