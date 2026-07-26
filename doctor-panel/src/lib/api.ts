export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * fetch wrapper: prefixes API_URL and attaches the Bearer token
 * from localStorage when available (client-side only).
 */
export function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

/** Persist the session both in localStorage (client guards) and as a cookie (server-side guard). */
export function setSession(token: string, role: string, name: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("doctor_name", name);
  document.cookie = `token=${token}; path=/; max-age=604800; samesite=lax`;
}

/** Clear every trace of the session (localStorage keys + token cookie). */
export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("doctor_name");
  document.cookie = "token=; path=/; max-age=0; samesite=lax";
}
