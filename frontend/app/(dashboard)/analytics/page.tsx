"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/analytics/admin"));
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  const cards = [
    { label: "Total Meetings", value: stats?.total_meetings ?? "–", icon: "event_note", color: "text-blue-500" },
    { label: "Live Meetings", value: stats?.live_meetings ?? "–", icon: "sensors", color: "text-lime" },
    { label: "Ended Meetings", value: stats?.ended_meetings ?? "–", icon: "event_available", color: "text-amber-500" },
    { label: "Communities", value: stats?.total_communities ?? "–", icon: "groups", color: "text-secondary" },
    { label: "Groups", value: stats?.total_groups ?? "–", icon: "account_tree", color: "text-purple-400" },
    { label: "Active Users", value: stats?.total_users ?? "–", icon: "person", color: "text-teal-400" },
    { label: "Total Action Items", value: stats?.total_action_items ?? "–", icon: "assignment", color: "text-indigo-400" },
    { label: "Completed Actions", value: stats?.completed_action_items ?? "–", icon: "task_alt", color: "text-lime" },
    { label: "Pending Actions", value: stats?.pending_action_items ?? "–", icon: "pending_actions", color: "text-error" },
    { label: "Completion Rate", value: stats?.action_completion_rate != null ? `${stats.action_completion_rate}%` : "–", icon: "trending_up", color: "text-lime" },
  ];

  return (
    <section className="space-y-8">
      <div>
        <h1 className="font-display text-display-xl text-primary">Analytics</h1>
        <p className="mt-1 text-body-lg text-muted">Platform-wide performance metrics and insights.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              className="glass-card flex flex-col justify-between rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className={`material-symbols-outlined ${card.color} text-[24px]`}>{card.icon}</span>
              </div>
              <div className="mt-4">
                <p className="text-display-md font-bold text-primary">{card.value}</p>
                <p className="text-label-md text-muted">{card.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
