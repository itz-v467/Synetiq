"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/analytics/admin"));
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  return (
    <section className="space-y-12">
      <div>
        <h1 className="font-display text-display-xl text-primary drop-shadow-[0_0_15px_rgba(198,255,77,0.2)]">Platform Analytics</h1>
        <p className="mt-2 text-body-lg text-muted">Organization-wide usage and meeting statistics.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-3xl bg-surface-container-low animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[100px] text-lime">event</span>
            </div>
            <div className="mb-4 flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-lime/20 text-lime shadow-[0_0_15px_rgba(198,255,77,0.2)]">
                <span className="material-symbols-outlined">total_cases</span>
              </div>
              <h3 className="text-label-lg font-semibold text-muted uppercase tracking-wide">Total Meetings</h3>
            </div>
            <p className="font-display text-display-lg text-primary relative z-10">{stats?.total_meetings ?? 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-8 relative overflow-hidden group border-lime/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-lime/5 to-transparent z-0" />
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[100px] text-lime">sensors</span>
            </div>
            <div className="mb-4 flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-lime text-primary shadow-[0_0_20px_rgba(198,255,77,0.4)] animate-pulse">
                <span className="material-symbols-outlined">sensors</span>
              </div>
              <h3 className="text-label-lg font-bold text-lime uppercase tracking-wide">Live Meetings</h3>
            </div>
            <p className="font-display text-display-lg text-primary relative z-10">{stats?.live_meetings ?? 0}</p>
          </motion.div>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-3xl p-16 text-center mt-12 border-dashed border-2 border-line-subtle/50 bg-gradient-to-b from-surface-container/20 to-transparent"
      >
        <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-surface-container-high mb-6 shadow-inner">
          <span className="material-symbols-outlined text-muted text-[48px]">monitoring</span>
        </div>
        <h3 className="text-headline-md text-primary mb-3">Advanced Charts Coming Soon</h3>
        <p className="text-body-lg text-muted max-w-lg mx-auto leading-relaxed">
          We are preparing detailed visualizations for attendance trends, AI generation time, and action item completion rates.
        </p>
      </motion.div>
    </section>
  );
}
