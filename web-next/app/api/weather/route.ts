import { NextResponse } from "next/server";

// Open-Meteo (free, no key)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ message: "Missing lat/lon" }, { status: 400 });
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
    `&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ message: "Weather fetch failed" }, { status: 500 });
  }

  const data = await res.json();
  const daily = data.daily || {};

  const out = (daily.time || []).slice(0, 3).map((date: string, i: number) => ({
    date,
    tMax: daily.temperature_2m_max?.[i],
    tMin: daily.temperature_2m_min?.[i],
    rainChance: daily.precipitation_probability_max?.[i],
    weathercode: daily.weathercode?.[i],
  }));

  return NextResponse.json({ days: out });
}