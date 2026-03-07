import { NextResponse } from "next/server";

function getBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  return fromEnv || "http://localhost:4000";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const base = getBaseUrl();

    const upstreamUrl = `${base}/trips/generate`;

    const cookie = req.headers.get("cookie") || "";

    const r = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const contentType = r.headers.get("content-type") || "application/json";
    const raw = await r.text();

    if (contentType.includes("application/json")) {
      try {
        const parsed = raw ? JSON.parse(raw) : {};
        return NextResponse.json(parsed, { status: r.status });
      } catch {
        return NextResponse.json(
          {
            error: "Upstream returned invalid JSON",
            upstreamUrl,
            status: r.status,
            raw: raw.slice(0, 300),
          },
          { status: 502 }
        );
      }
    }

    return new NextResponse(raw, {
      status: r.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Next /api/generate crashed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}