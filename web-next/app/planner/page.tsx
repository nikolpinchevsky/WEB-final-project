"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// טעינת מפה בצד המשתמש
const MapView = dynamic(() => import("./map-view"), { ssr: false });

type TripType = "bike" | "trek";
type LatLng = { lat: number; lng: number };

export default function PlannerPage() {
  // קלט מהמשתמש
  const [location, setLocation] = useState("Israel"); // איפה מטיילים
  const [tripType, setTripType] = useState<TripType>("bike");
  const [days, setDays] = useState(2);
  // תהליך היצירה
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  // תהליך השמירה
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  //API הבאת תמונה מחיצוני
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const placeImageUrl = useMemo(() => {
    const place = location.trim() || "Israel";
    const q = encodeURIComponent(`${place} landscape`);
    return `https://source.unsplash.com/800x800/?${q}`;
  }, [location]);

  // חישוב גבולות המפה
  // מציאת קו רוחב ואורך מינמלי ומקסימלי בין כל הנקודות כדי להגדיר את גבולות המפה
  const boundsText = useMemo(() => {
    if (!result?.geometry?.length) return null;
    const pts: LatLng[] = result.geometry;
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const minLat = Math.min(...lats).toFixed(4);
    const maxLat = Math.max(...lats).toFixed(4);
    const minLng = Math.min(...lngs).toFixed(4);
    const maxLng = Math.max(...lngs).toFixed(4);
    return `Bounds: lat ${minLat}–${maxLat}, lng ${minLng}–${maxLng}`;
  }, [result]);

  // שליחת בקשה ליצרת מסלול
  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedId(null);
    setSaveError(null);
    // שולח את כל הנתונים של יצירת טיול
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, tripType, days }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      setError(
        data?.error
          ? `${data.error}${data.details ? " | details: " + JSON.stringify(data.details).slice(0, 200) : ""}`
          : data?.message
          ? `${data.message}${data.details ? " | details: " + String(data.details).slice(0, 200) : ""}`
          : "Failed to generate trip"
      );
      setLoading(false);
      return;
    }

    setResult(data);
    setImageUrl(null);
    setImageLoading(true);
    fetch(`/api/image?q=${encodeURIComponent(location)}&t=${Date.now()}`, {
    cache: "no-store", })
    .then((x) => x.json())
    .then((img) => setImageUrl(img?.imageUrl || null))
    .catch(() => setImageUrl(null))
    .finally(() => setImageLoading(false));
    setLoading(false);
  }

  // עיבוד ושמירת המסלול בדאטה בייס
  async function onApproveAndSave() {
    if (!result) return; // אין תוצאה לשמור
    setSaving(true);  // מתחיל תהליך שמירה
    setSaveError(null); 

    const payload = { ...result }; // תחזית שנשמרה
    delete payload.forecast; // מחיקת היסטוריית מזג אוויר
    // Reverse Geocoding
    if (!payload.location && payload.routeGeoJson) { 
      const coords = payload.routeGeoJson?.features?.[0]?.geometry?.coordinates;

      if (Array.isArray(coords) && coords.length > 0) {
        const [lon, lat] = coords[0];

        try {
          const r = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
          const j = await r.json();

          if (r.ok && j?.name) {
            payload.location = j.name;
          }
        } catch {}
      }
    }

    // API Call לשמירת המסלול
    const r = await fetch("/api/trips/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      body: JSON.stringify(payload),
    });
    
     // טיפול בתגובה מהשרת והחזרה לעמוד ההתחברות
    if (r.status === 401) {
      setSaving(false);
      window.location.href = "/login?next=/planner";
      return;
    }

    const data = await r.json().catch(() => ({}));

    if (!r.ok || !data?.ok) {
      setSaveError(
        data?.message
          ? `${data.message}${data.details ? " | " + String(data.details).slice(0, 200) : ""}`
          : "Failed to save trip"
      );
      setSaving(false);
      return;
    }

    setSavedId(String(data.id));
    setSaving(false);
}

  return (
    <main className="grid" dir="rtl" lang="he">
      {/* Left: Form */}
      <section className="card cardPad">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h1 className="h1" style={{ margin: 0 }}>
              תכנון מסלול
            </h1>
            <p className="pMuted" style={{ marginTop: 6 }}>
              מגדירים יעד, סוג טיול ומשך — ומייצרים מסלול.
            </p>
          </div>

          <Link
            href="/"
            className="btn"
            style={{
              textDecoration: "none",
              whiteSpace: "nowrap",
              height: 40,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 14px",
            }}
          >
            חזרה לדף הראשי
          </Link>
        </header>

        <form onSubmit={onGenerate} style={{ marginTop: 16 }}>
          <label className="label">מדינה / עיר</label>
          <input
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="למשל: Italy, Rome"
          />

          <div style={{ height: 12 }} />

          <label className="label">סוג טיול</label>
          <select
            className="select"
            value={tripType}
            onChange={(e) => {
              const t = e.target.value as TripType;
              setTripType(t);
              setDays(t === "bike" ? 2 : 1);
            }}
          >
            <option value="bike">אופניים</option>
            <option value="trek">טרק רגלי</option>
          </select>

          <div style={{ height: 12 }} />

          <label className="label">משך (ימים)</label>
          <input
            className="input"
            type="number"
            min={tripType === "bike" ? 2 : 1}
            max={3}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />

          <p className="pMuted" style={{ marginTop: 10, fontSize: 13 }}>
            {tripType === "bike"
              ? "אופניים: 2–3 ימים רציפים (עיר לעיר), 30–70 ק״מ/יום"
              : "טרק: 1–3 לופים שמתחילים ומסתיימים באותה נקודה, 5–10 ק״מ/יום"}
          </p>

          <div style={{ height: 14 }} />

          <button className="btn" disabled={loading} type="submit">
            {loading ? "מייצר..." : "צור מסלול"}
          </button>

          {error && (
            <p className="error" style={{ marginTop: 12 }}>
              {error}
            </p>
          )}
        </form>
      </section>

      {/* Right: Result */}
      <section className="card cardPad">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2 className="h2" style={{ marginBottom: 4 }}>
              תוצאה
            </h2>
            <p className="pMuted" style={{ fontSize: 13 }}>
              כאן נראה: תמונה, תחזית, מפה וסיכום.
            </p>
          </div>
          {result?.tripType && <span className="badge">{result.tripType}</span>}
        </div>

        {!result && (
          <div style={{ marginTop: 14 }} className="pMuted">
            עדיין אין תוצאה. לחצי “צור מסלול”.
          </div>
        )}

        {result && (
          <>
            {/* Image */}
            <div style={{ marginTop: 14 }} className="card">
              <div className="cardPad">
                <h3 className="h2" style={{ marginBottom: 10 }}>
                  תמונה (לפי היעד)
                </h3>

                <div
                  style={{
                    maxWidth: 420,
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {imageLoading ? (
                    <div className="pMuted">טוען תמונה…</div>
                  ) : imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`תמונה של ${location}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div className="pMuted" style={{ padding: 12, textAlign: "center" }}>
                      אין תמונה זמינה ליעד הזה כרגע.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={{ marginTop: 14 }} className="card">
              <div className="cardPad">
                <div className="row">
                  <div>
                    <div className="pMuted" style={{ fontSize: 12 }}>
                      יעד
                    </div>
                    <div style={{ fontWeight: 800 }}>{result.name}</div>
                  </div>
                  <div>
                    <div className="pMuted" style={{ fontSize: 12 }}>
                      ימים
                    </div>
                    <div style={{ fontWeight: 800 }}>{result.days}</div>
                  </div>
                </div>

                <div style={{ height: 10 }} />
                <div className="pMuted" style={{ fontSize: 13 }}>
                  {result.summary}
                </div>

                {(typeof result.distanceKm === "number" || typeof result.durationMin === "number") && (
                  <div className="pMuted" style={{ fontSize: 12, marginTop: 6 }}>
                    {typeof result.distanceKm === "number" ? `מרחק: ${result.distanceKm} ק״מ` : ""}
                    {typeof result.distanceKm === "number" && typeof result.durationMin === "number" ? " • " : ""}
                    {typeof result.durationMin === "number" ? `זמן: ${result.durationMin} דק׳` : ""}
                  </div>
                )}

                {boundsText && (
                  <div className="pMuted" style={{ fontSize: 12, marginTop: 6 }}>
                    {boundsText}
                  </div>
                )}

                <div style={{ height: 14 }} />
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <button className="btn" onClick={onApproveAndSave} disabled={saving}>
                    {saving ? "שומר..." : "אשר ושמור"}
                  </button>
                  {savedId && <span className="badge">נשמר ✅ ID: {savedId}</span>}
                </div>

                {saveError && (
                  <p className="error" style={{ marginTop: 12 }}>
                    {saveError}
                  </p>
                )}
              </div>
            </div>

            {/* Forecast */}
            <div style={{ height: 14 }} />
            {Array.isArray(result.forecast) && result.forecast.length > 0 ? (
              <div className="card">
                <div className="cardPad">
                  <h3 className="h2" style={{ marginBottom: 8 }}>
                    תחזית ל־3 ימים (מתחיל מחר)
                  </h3>

                  <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                    {result.forecast.map((f: any) => (
                      <div key={f.date} className="card" style={{ boxShadow: "none" }}>
                        <div className="cardPad">
                          <div style={{ fontWeight: 800 }}>
                            {new Date(f.date).toLocaleDateString("he-IL", {
                              weekday: "short",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </div>

                          <div style={{ height: 8 }} />
                          <div className="pMuted" style={{ fontSize: 13 }}>
                            מינ׳ {Math.round(f.tempMin)}° • מקס׳ {Math.round(f.tempMax)}°
                          </div>

                          {typeof f.windMax === "number" && (
                            <div className="pMuted" style={{ fontSize: 12, marginTop: 6 }}>
                              רוח עד {Math.round(f.windMax)} קמ״ש
                            </div>
                          )}

                          {typeof f.weatherCode !== "undefined" && (
                            <div className="pMuted" style={{ fontSize: 12, marginTop: 6 }}>
                              קוד מז״א: {f.weatherCode}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pMuted" style={{ fontSize: 12, marginTop: 10 }}>
                    * התחזית מתייחסת לאזור המסלול ולשלושת הימים הקרובים החל ממחר.
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="cardPad">
                  <h3 className="h2" style={{ marginBottom: 6 }}>
                    תחזית
                  </h3>
                  <div className="pMuted">אין תחזית זמינה כרגע.</div>
                </div>
              </div>
            )}

            {/* Map */}
            <div style={{ height: 14 }} />
            <div className="card">
              <div className="cardPad">
                <h3 className="h2" style={{ marginBottom: 10 }}>
                  מפה
                </h3>

                {Array.isArray(result.geometry) && result.geometry.length ? (
                  <MapView points={result.geometry as LatLng[]} />
                ) : (
                  <div className="pMuted">אין נקודות גיאומטריה להצגה על המפה.</div>
                )}
              </div>
            </div>

            <div style={{ height: 14 }} />

            {/* Bike route table */}
            {result.route?.length ? (
              <div className="card">
                <div className="cardPad">
                  <h3 className="h2">ימים (אופניים)</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    {result.route.map((d: any) => (
                      <div key={d.day} className="card" style={{ boxShadow: "none" }}>
                        <div className="cardPad">
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ fontWeight: 800 }}>יום {d.day}</div>
                            <div className="badge">{d.distanceKm} ק״מ</div>
                          </div>
                          <div className="pMuted" style={{ marginTop: 6 }}>
                            {d.from} → {d.to}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Trek loops */}
            {result.loops?.length ? (
              <div className="card">
                <div className="cardPad">
                  <h3 className="h2">לופים (טרק)</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    {result.loops.map((l: any) => (
                      <div key={l.loop} className="card" style={{ boxShadow: "none" }}>
                        <div className="cardPad">
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ fontWeight: 800 }}>מסלול {l.loop}</div>
                            <div className="badge">{l.distanceKm} ק״מ</div>
                          </div>
                          <div className="pMuted" style={{ marginTop: 6 }}>
                            {l.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ height: 14 }} />

            <details>
              <summary className="pMuted" style={{ cursor: "pointer" }}>
                תוצאה מלאה (JSON)
              </summary>
              <pre className="pre" style={{ marginTop: 10 }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </>
        )}
      </section>
    </main>
  );
}