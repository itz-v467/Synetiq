"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  color?: string;
}

function StatCard({ label, value, icon, trend, color = "text-secondary" }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card flex flex-col justify-between rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className={`material-symbols-outlined ${color} text-[24px]`}>{icon}</span>
        {trend && (
          <span className="rounded-pill bg-success-container px-2 py-0.5 text-label-sm text-success">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-display-md font-bold text-primary">{value}</p>
        <p className="text-label-md text-muted">{label}</p>
      </div>
    </motion.div>
  );
}

export function StatsGrid({ stats }: { stats: any }) {
  const cards = [
    { label: "Meetings Today", value: stats?.meetings_today ?? 0, icon: "calendar_today", color: "text-blue-500" },
    { label: "Total Meetings", value: stats?.total_meetings ?? 0, icon: "event", color: "text-amber-500" },
    { label: "Live Meetings", value: stats?.live_meetings ?? 0, icon: "bolt", color: "text-error" },
    { label: "Communities", value: stats?.total_communities ?? 0, icon: "public", color: "text-lime" },
    { label: "Groups", value: stats?.total_groups ?? 0, icon: "groups", color: "text-secondary" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
}
