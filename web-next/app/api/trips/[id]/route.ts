import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL!;
    const cookie = req.headers.get("cookie") || "";

    const res = await fetch(`${apiBase}/trips/${id}`, {
      method: "GET",
      headers: { cookie },
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Failed to load trip", details: String(e) },
      { status: 500 }
    );
  }
}