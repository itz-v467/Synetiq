import { apiUrl } from "./api";

const TOKEN_KEY = "synetiq_access_token";
const REFRESH_KEY = "synetiq_refresh_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function syncCookie(access: string | null) {
  if (typeof document === "undefined") return;
  if (access) {
    document.cookie = `synetiq_access_token=${access}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`;
  } else {
    document.cookie = "synetiq_access_token=; path=/; max-age=0";
  }
}

export function setToken(access: string, refresh?: string) {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  syncCookie(access);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  syncCookie(null);
}

export async function fetchWithAuth(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && typeof window !== "undefined") {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (refresh) {
      const r = await fetch(apiUrl("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (r.ok) {
        const data = await r.json();
        setToken(data.access_token, data.refresh_token);
        headers.set("Authorization", `Bearer ${data.access_token}`);
        return fetch(input, { ...init, headers });
      }
    }
    clearToken();
    window.location.href = "/login";
  }
  return res;
}
