import { apiUrl } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";

export async function getDashboardStats() {
  const res = await fetchWithAuth(apiUrl("/api/v1/analytics/dashboard"));
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}

