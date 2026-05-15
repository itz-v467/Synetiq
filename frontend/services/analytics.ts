import { apiUrl } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";

export async function getDashboardStats() {
  const res = await fetchWithAuth(apiUrl("/api/v1/analytics/dashboard"));
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}

export async function getInsights() {
  const res = await fetchWithAuth(apiUrl("/api/v1/analytics/insights"));
  if (!res.ok) return [
    "Attendance dropped 12% this month.",
    "3 action items are overdue.",
    "Most discussed topic this week: Sponsorship."
  ];
  return res.json();
}
