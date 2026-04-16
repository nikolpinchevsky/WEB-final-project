"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const r = useRouter();
  const [name, setName] = useState(""); // שם פרטי
  const [email, setEmail] = useState(""); // אימייל
  const [password, setPassword] = useState(""); // סיסמה
  const [err, setErr] = useState<string | null>(null); // שגיאות אפשריות בתהליך ההרשמה
  const [loading, setLoading] = useState(false); // מצב טעינה בזמן שליחת הטופס

  // יצירת משתמש חדש
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); 
    setErr(null); 
    setLoading(true); 

    try { // קריאה לשרת 
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      
      // אם השרת מחזיר שגיאה, קריאת הודעת השגיאה מהתגובה והצגתה למשתמש
      if (!res.ok) { 
        const j = await res.json().catch(() => ({}));
        setErr(j.message || "Sign up failed");
        setLoading(false);
        return;
      }

      r.push("/login"); // הרשמה צלחה ומעבר למסך התחברות
    } catch (error) { // טיפול בשגיאת רשת או שגיאה בלתי צפויה
      setErr("Sign up failed");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div style={{ maxWidth: 420, width: "100%", padding: "40px 20px" }}>
        <div style={{ 
          backgroundColor: "var(--panel)", 
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "40px",
          boxShadow: "var(--shadow)"
        }}>
          <h1 style={{ textAlign: "center", marginBottom: "30px", color: "var(--text)", fontSize: "28px", margin: "0 0 30px 0" }}>Sign Up</h1>
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input
              placeholder="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "14px",
                boxSizing: "border-box",
                backgroundColor: "var(--panel2)",
                color: "var(--text)",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(84, 189, 255, 0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(84, 189, 255, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <input
              placeholder="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "14px",
                boxSizing: "border-box",
                backgroundColor: "var(--panel2)",
                color: "var(--text)",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(84, 189, 255, 0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(84, 189, 255, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <input
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "14px",
                boxSizing: "border-box",
                backgroundColor: "var(--panel2)",
                color: "var(--text)",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(84, 189, 255, 0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(84, 189, 255, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: loading ? "rgba(84, 189, 255, 0.1)" : "rgba(84, 189, 255, 0.2)",
                color: "var(--text)",
                border: loading ? "1px solid rgba(84, 189, 255, 0.15)" : "1px solid rgba(84, 189, 255, 0.3)",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "rgba(84, 189, 255, 0.3)", e.currentTarget.style.borderColor = "rgba(84, 189, 255, 0.5)")}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "rgba(84, 189, 255, 0.2)", e.currentTarget.style.borderColor = "rgba(84, 189, 255, 0.3)")}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>
          {err && <p style={{ color: "rgba(255, 107, 107, 0.9)", backgroundColor: "rgba(255, 107, 107, 0.1)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255, 107, 107, 0.2)", textAlign: "center", margin: "15px 0 0 0" }}>{err}</p>}
          <div style={{ textAlign: "center", marginTop: "25px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: "0" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "rgba(84, 189, 255, 0.9)", textDecoration: "none", fontWeight: "bold" }}>
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}