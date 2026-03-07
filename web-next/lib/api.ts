export async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.headers || {}),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}