import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ message: "Missing q" }, { status: 400 });
  }

  // Nominatim: free geocoding (OpenStreetMap)
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?format=json&limit=1&q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    headers: {
      // Nominatim requests identifying UA; this is a simple best-practice header
      "User-Agent": "afeka-trips-2026/1.0 (student-project)",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ message: "Geocoding failed" }, { status: 500 });
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ message: "Location not found" }, { status: 404 });
  }

  const first = data[0];
  const lat = Number(first.lat);
  const lon = Number(first.lon);

  return NextResponse.json({ lat, lon, displayName: first.display_name });
}