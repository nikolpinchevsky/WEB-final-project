import { NextResponse } from "next/server";

// מגדירים אילו סוגי ניתוב אנחנו תומכים: הליכה או נסיעה
type Profile = "driving" | "walking";

// קריאת הנתונים שנשלחו בבקשה
export async function POST(req: Request) {
  const body = await req.json();
  const { points, profile } = body as {
    points: [number, number][]; // [lat, lon] מערך נקודות ציון
    profile?: Profile;
  };

  if (!points || points.length < 2) {
    return NextResponse.json({ message: "Need at least 2 points" }, { status: 400 });
  }

  // הגדרת פרופיל הניתוב אם זה הליכה או אופניים
  const prof: Profile = profile === "walking" ? "walking" : "driving";

  const coords = points.map(([lat, lon]) => `${lon},${lat}`).join(";");
  
  const url = `https://router.project-osrm.org/route/v1/${prof}/${coords}?overview=full&geometries=geojson`;
  // שליחת הבקשה
  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ message: "Routing failed" }, { status: 500 });
  
  // עיבוד התשובה
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return NextResponse.json({ message: "No route found" }, { status: 404 });

  // בניית אוביקט גייסון
  const geoJson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          distanceMeters: route.distance, // מרחק במטרים
          durationSeconds: route.duration, // זמן מחושב בשניות
          profile: prof,
        },
        geometry: route.geometry, // המסלול עצמו שייוצר על המפה
      },
    ],
  };

  return NextResponse.json({
    geoJson,
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    durationMin: Math.round((route.duration / 60) * 10) / 10,
  });
}