"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

const MapView = dynamic(() => import("@/components/TripMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        color: "#666",
      }}
    >
      טוען מפה...
    </div>
  ),
});

type Trip = {
  _id: string;
  location?: string;
  type?: string;
  days?: number;
  createdAt?: number;
  routeGeoJson?: any;
  geometry?: Array<{ lat: number; lng: number }>;
  center?: { lat: number; lng: number };
  distancesKm?: number[];
  distanceKm?: number;
  durationMin?: number | null;
};

type ForecastDay = {
  date: string;
  tempMax?: number;
  tempMin?: number;
  tMax?: number;
  tMin?: number;
  rainChance?: number;
  weathercode?: number;
  weatherCode?: number;
};

export default function TripDetailsClient({ id }: { id: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const points = useMemo<Array<{ lat: number; lng: number }>>(() => {
    if (!trip) return [];

    if (Array.isArray(trip.geometry) && trip.geometry.length > 0) {
      return trip.geometry
        .map((p: any) => {
          const lat = Number(p.lat ?? p.latitude);
          const lng = Number(p.lng ?? p.lon ?? p.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng };
          }
          return null;
        })
        .filter((p): p is { lat: number; lng: number } => p !== null);
    }

    const coords = trip.routeGeoJson?.features?.[0]?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length > 0) {
      return coords
        .map((coord: any) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            const lng = Number(coord[0]);
            const lat = Number(coord[1]);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              return { lat, lng };
            }
          }
          return null;
        })
        .filter((p): p is { lat: number; lng: number } => p !== null);
    }

    return [];
  }, [trip]);

  const geoJson = useMemo(() => {
    if (!points || points.length < 2) return null;

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: points.map((p) => [p.lng, p.lat]),
          },
        },
      ],
    };
  }, [points]);

  const center = useMemo<[number, number]>(() => {
    const fallback: [number, number] = [52.52, 13.405];

    try {
      if (points.length > 0) {
        return [points[0].lat, points[0].lng];
      }

      const coords1 = trip?.routeGeoJson?.features?.[0]?.geometry?.coordinates;
      if (Array.isArray(coords1) && coords1.length > 0) {
        const first = coords1[0];
        if (Array.isArray(first) && first.length >= 2) {
          const lon = Number(first[0]);
          const lat = Number(first[1]);
          if (Number.isFinite(lat) && Number.isFinite(lon)) return [lat, lon];
        }
      }

      const coords2 = (trip as any)?.geometry;
      if (Array.isArray(coords2) && coords2.length > 0) {
        const first = coords2[0];
        if (Array.isArray(first) && first.length >= 2) {
          const lon = Number(first[0]);
          const lat = Number(first[1]);
          if (Number.isFinite(lat) && Number.isFinite(lon)) return [lat, lon];
        }
      }

      const c = (trip as any)?.center;
      if (c) {
        const lat = Number(c.lat ?? c.latitude);
        const lon = Number(c.lon ?? c.lng ?? c.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lon)) return [lat, lon];
      }
    } catch {}

    return fallback;
  }, [trip, points]);

  async function load() {
    setErr(null);
    setTrip(null);
    setForecast(null);

    try {
      const res = await apiFetch(`/trips/${id}`, { method: "GET" });
      const t: Trip = res.trip;
      setTrip(t);

      if (res.trip.forecast && Array.isArray(res.trip.forecast)) {
        setForecast(res.trip.forecast);
      } else {
        const coords =
          t?.routeGeoJson?.features?.[0]?.geometry?.coordinates ?? (t as any)?.geometry;

        if (Array.isArray(coords) && coords.length > 0) {
          const first = coords[0];

          let lon: number | null = null;
          let lat: number | null = null;

          if (Array.isArray(first) && first.length >= 2) {
            lon = Number(first[0]);
            lat = Number(first[1]);
          } else if (first && typeof first === "object") {
            lat = Number((first as any).lat ?? (first as any).latitude);
            lon = Number((first as any).lon ?? (first as any).lng ?? (first as any).longitude);
          }

          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            const wRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
            const wJson = await wRes.json();
            if (wRes.ok) setForecast(wJson.days);
          }
        }
      }
    } catch (e: any) {
      setErr(e?.message || "Failed to load trip");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const distance = trip?.distanceKm ?? (trip?.distancesKm?.length ? trip.distancesKm[0] : null);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
        <Link
          href="/history"
          style={{
            background: "linear-gradient(90deg,#6ea8ff,#9b7bff)",
            padding: "8px 16px",
            borderRadius: 20,
            color: "white",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          חזרה להיסטוריה
        </Link>
      </div>

      <h1>פרטי מסלול</h1>

      {err && <p style={{ color: "red" }}>שגיאה: {err}</p>}
      {!trip && !err && <p>טוען...</p>}

      {trip && (
        <>
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <b>{trip.location || (trip as any).name || "Unknown"}</b>
              <span style={{ fontSize: 12, opacity: 0.7, whiteSpace: "nowrap" }}>
                {trip.createdAt ? new Date(trip.createdAt).toLocaleString() : ""}
              </span>
            </div>

            <div style={{ marginTop: 6 }}>
              סוג: <b>{trip.type || (trip as any).tripType || "Unknown"}</b> | ימים:{" "}
              <b>{trip.days}</b>
            </div>

            {(distance != null || trip.durationMin != null) && (
              <div style={{ marginTop: 6 }}>
                {distance != null && (
                  <>
                    מרחק: <b>{distance} ק״מ</b>
                  </>
                )}
                {distance != null && trip.durationMin != null ? " | " : ""}
                {trip.durationMin != null && (
                  <>
                    זמן: <b>{trip.durationMin} דקות</b>
                  </>
                )}
              </div>
            )}

            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>id: {trip._id}</div>
          </div>

          <h2>מפה</h2>
          {geoJson ? (
            Number.isFinite(center[0]) && Number.isFinite(center[1]) ? (
              <MapView geoJson={geoJson} center={center} />
            ) : (
              <p style={{ opacity: 0.8 }}>אין נקודת מרכז תקינה למפה.</p>
            )
          ) : (
            <p style={{ opacity: 0.8 }}>אין נתוני מסלול להצגה במפה.</p>
          )}

          {forecast && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 12,
              }}
            >
              <h3 style={{ marginTop: 0 }}>תחזית ל-3 ימים (התחלה מחר)</h3>
              <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                {forecast.slice(1, 4).map((d) => {
                  const tempMax = d.tempMax ?? d.tMax;
                  const tempMin = d.tempMin ?? d.tMin;
                  const rainChance = d.rainChance;

                  return (
                    <li key={d.date} style={{ marginBottom: 6 }}>
                      <b>{d.date}</b> — מינ׳ {tempMin}° | מקס׳ {tempMax}° | סיכוי גשם{" "}
                      {rainChance}%
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}