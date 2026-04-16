"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// הגדרת סוג נתונים של רוחב ואורך
type LatLng = { lat: number; lng: number };

// רכיב שמכוון את המפה כך שתכלול את כל הנקודות הנתונות
function FitToRoute({ points }: { points: LatLng[] }) {
  const map = useMap(); // נותן שליטה על המפה

  useEffect(() => {
    if (!points?.length) return;
    const latlngs = points.map((p) => L.latLng(p.lat, p.lng));
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [30, 30] }); // מזיז את המפה ועושה זום למיקום שצריך

  }, [points, map]);

  return null;
}

// רכיב המפה הראשי שמקבל מערך של נקודות ומציג אותן על המפה
// תצוגת המפה במסך עצמו
export default function MapView({ points }: { points: LatLng[] }) {
  const center: [number, number] = points?.length
    ? [points[0].lat, points[0].lng]
    : [32.0853, 34.7818]; 

    // מכין רשימה של הנקודות בפורמט הדרוש ליצור קו
  const polyline: [number, number][] = (points || []).map((p) => [p.lat, p.lng]);

  return ( // יצירת חלון המפה, קביעת נקודת האמצע, זום התחלתי ועיצוב גודל החלון
    <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: 420, width: "100%", borderRadius: 16 }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {polyline.length >= 2 && <Polyline positions={polyline} />}

      {points?.length ? <FitToRoute points={points} /> : null}
    </MapContainer>
  );
}