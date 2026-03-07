import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 40 }} dir="rtl" lang="he">
      <h1 style={{ fontSize: 32, marginBottom: 10 }}>
        מסלול טיולים אפקה 2026
      </h1>

      <p style={{ marginBottom: 30 }}>
        ברוכים הבאים למערכת תכנון מסלולים.
      </p>

      <div style={{ display: "flex", gap: 20 }}>
        <Link
          href="/planner"
          style={{
            padding: "14px 24px",
            background: "#2563eb",
            color: "white",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          תכנון מסלול
        </Link>

        <Link
          href="/history"
          style={{
            padding: "14px 24px",
            background: "#16a34a",
            color: "white",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          היסטוריית מסלולים
        </Link>
      </div>
    </main>
  );
}