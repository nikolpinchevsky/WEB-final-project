"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

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

      r.push("/planner");
    } catch (error) {
      setErr("Login failed");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign in</button>
      </form>
      {err && <p style={{ color: "red" }}>{err}</p>}
    </div>
  );
}