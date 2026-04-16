"use client"; 

import { useState } from "react"; // מאפשר לשמור משתנים לאורך זמן
import { useRouter } from "next/navigation"; // ניווט בין עמודים דרך הקוד
import Link from "next/link";

export default function LoginPage() {
  const r = useRouter(); // פונקציית הניווט
  const [email, setEmail] = useState(""); // שמירת שם משתמש 
  const [password, setPassword] = useState(""); // שמירת סיסמה
  const [err, setErr] = useState<string | null>(null); // שמירת הודעת שגיאה

  // התחברות למשתמש קיים
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); 
    setErr(null); 

  // ניסיון התחברות לשרת עם פרטי המשתמש
    try { 
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) { 
        const j = await res.json().catch(() => ({}));
        setErr(j.message || "Login failed");
        return;
      }

      r.push("/"); // התחברות צלחה ומעבר למסך בית
    } catch (error) { // טיפול בשגיאת רשת או שגיאה בלתי צפויה
      setErr("Login failed");
    }
  }

    // יצירת הטופס
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
          <h1 style={{ textAlign: "center", marginBottom: "30px", color: "var(--text)", fontSize: "28px", margin: "0 0 30px 0" }}>Login</h1>
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
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
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "rgba(84, 189, 255, 0.2)",
                color: "var(--text)",
                border: "1px solid rgba(84, 189, 255, 0.3)",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(84, 189, 255, 0.3)";
                e.currentTarget.style.borderColor = "rgba(84, 189, 255, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(84, 189, 255, 0.2)";
                e.currentTarget.style.borderColor = "rgba(84, 189, 255, 0.3)";
              }}
            >
              Sign in
            </button>
          </form>
          {err && <p style={{ color: "rgba(255, 107, 107, 0.9)", backgroundColor: "rgba(255, 107, 107, 0.1)", padding: "12px 16px", borderRadius: "8px", marginTop: "15px", textAlign: "center", border: "1px solid rgba(255, 107, 107, 0.2)", margin: "15px 0 0 0" }}>{err}</p>}
          <div style={{ textAlign: "center", marginTop: "25px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: "0" }}>
              Don't have an account?{" "}
              <Link href="/signup" style={{ color: "rgba(84, 189, 255, 0.9)", textDecoration: "none", fontWeight: "bold" }}>
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}