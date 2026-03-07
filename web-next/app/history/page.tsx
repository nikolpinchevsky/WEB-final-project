"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Trip = {
  _id: string;
  userId?: string;
  name?: string;
  location?: string;
  tripType?: string;
  type?: string;
  days?: number;
  distancesKm?: number[];
  durationMin?: number | null;
  createdAt?: number;
};

export default function HistoryPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function loadTrips() {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiFetch("/trips", { method: "GET" });
      setTrips(res.trips || []);
    } catch (e: any) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
        <Link
          href="/"
          style={{
            background: "linear-gradient(90deg,#6ea8ff,#9b7bff)",
            padding: "8px 16px",
            borderRadius: 20,
            color: "white",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          חזרה לדף הראשי
        </Link>
      </div>

      <h1>מסלולים היסטוריה</h1>

      <button onClick={loadTrips}>רענן</button>

      {loading && <p>טוען...</p>}
      {err && <p style={{ color: "red" }}>שגיאה: {err}</p>}

      {!loading && !err && trips.length === 0 && <p>אין עדיין מסלולים שמורים.</p>}

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {trips.map((t) => {
          const distance =
            Array.isArray(t.distancesKm) && t.distancesKm.length > 0 ? t.distancesKm[0] : null;

          return (
            <Link
              key={t._id}
              href={`/history/${t._id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: 12,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <b>{t.location || t.name || "Unknown"}</b>
                  <span style={{ fontSize: 12, opacity: 0.7, whiteSpace: "nowrap" }}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleString() : ""}
                  </span>
                </div>

                <div style={{ marginTop: 6 }}>
                  סוג: <b>{t.type || t.tripType}</b>
                </div>

                {(distance != null || t.durationMin != null) && (
                  <div style={{ marginTop: 6, fontSize: 14 }}>
                    {distance != null && (
                      <>
                        מרחק: <b>{distance} ק״מ</b>
                      </>
                    )}
                    {distance != null && t.durationMin != null ? " | " : ""}
                    {t.durationMin != null && (
                      <>
                        זמן: <b>{t.durationMin} דקות</b>
                      </>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                  לחץ/י לפרטים
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}