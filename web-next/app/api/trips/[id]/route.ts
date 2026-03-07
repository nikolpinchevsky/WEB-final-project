import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
      "http://localhost:4000";

    const upstreamUrl = `${base}/trips/${params.id}`;
    const cookie = req.headers.get("cookie") || "";

    const r = await fetch(upstreamUrl, {
      method: "GET",
      headers: { cookie },
      cache: "no-store",
    });

    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": r.headers.get("content-type") || "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Next /api/trips/[id] crashed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}