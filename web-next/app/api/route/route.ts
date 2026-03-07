import { NextResponse } from "next/server";

type Profile = "driving" | "walking";

export async function POST(req: Request) {
  const body = await req.json();
  const { points, profile } = body as {
    points: [number, number][]; // [lat, lon]
    profile?: Profile;
  };

  if (!points || points.length < 2) {
    return NextResponse.json({ message: "Need at least 2 points" }, { status: 400 });
  }

  const prof: Profile = profile === "walking" ? "walking" : "driving";

  // OSRM expects lon,lat
  const coords = points.map(([lat, lon]) => `${lon},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/${prof}/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ message: "Routing failed" }, { status: 500 });

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return NextResponse.json({ message: "No route found" }, { status: 404 });

  const geoJson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          distanceMeters: route.distance,
          durationSeconds: route.duration,
          profile: prof,
        },
        geometry: route.geometry, // GeoJSON LineString
      },
    ],
  };

  return NextResponse.json({
    geoJson,
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    durationMin: Math.round((route.duration / 60) * 10) / 10,
  });
}