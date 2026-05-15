"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";
import { getDashboardStats, getInsights } from "@/services/analytics";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: healthData } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const r = await fetch(apiUrl("/health"));
      return r.json();
    },
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const { data: insights } = useQuery({
    queryKey: ["insights"],
    queryFn: getInsights,
  });

  const health = healthData?.ollama === "running" ? "ready" : healthData ? "degraded" : "offline";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/insights?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <section className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-display-xl text-primary"
          >
            Command center
          </motion.h1>
          <p className="mt-2 max-w-2xl text-body-lg text-muted">
            Governance-grade meeting intelligence: multilingual capture, structured minutes, and institutional memory—
            in one calm workspace.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-pill bg-surface-container-high p-1">
          <span className="rounded-pill bg-white px-5 py-2 text-label-caps text-primary shadow-sm">Overview</span>
          <Link href="/meetings" className="rounded-pill px-5 py-2 text-label-caps text-muted transition hover:bg-surface-container-highest">
            Meetings
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <StatsGrid stats={stats} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-headline-md text-primary">System status</h2>
              <span className="relative flex h-3 w-3">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${
                    health === "ready" ? "bg-lime" : health === "degraded" ? "bg-amber-400" : "bg-error"
                  }`}
                />
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full ${
                    health === "ready" ? "bg-lime" : health === "degraded" ? "bg-amber-400" : "bg-error"
                  }`}
                />
              </span>
            </div>
            <p className="text-body-md text-muted">
              {health === "ready" && "API and core services reachable. Ollama reports running for on-device MOM generation."}
              {health === "degraded" && "API is up; Ollama may be offline—start `ollama serve` on the host for full AI."}
              {health === "offline" && "Could not reach /health. Confirm `docker compose up` and nginx on port 8080."}
            </p>
            {healthData && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(healthData).filter(([k]) => k !== "status").map(([key, val]) => (
                  <span key={key} className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-label-sm ${
                    val === "running" || val === "connected" || val === "online" || val === "ready"
                      ? "bg-lime/15 text-lime"
                      : "bg-error/15 text-error"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      val === "running" || val === "connected" || val === "online" || val === "ready" ? "bg-lime" : "bg-error"
                    }`} />
                    {key}: {val as string}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/docs" className="btn-primary inline-block text-center">
                Open API docs
              </a>
            </div>
          </motion.article>

          <form onSubmit={handleSearch} className="glass-card flex flex-wrap items-center gap-3 rounded-pill p-2 pl-6 shadow-sm">
            <span className="material-symbols-outlined text-line">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent text-body-md focus:ring-0"
              placeholder="Search past meetings, decisions, or owners…"
            />
            <div className="hidden h-8 w-px bg-line-subtle/40 sm:block" />
            <div className="flex flex-wrap gap-2">
              <Link href="/meetings" className="rounded-pill bg-surface-container-highest px-4 py-2 text-label-caps text-on-surface-variant hover:bg-surface-container-high transition">Date range</Link>
              <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-pill bg-primary text-primary-foreground">
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <InsightsPanel insights={insights || []} />
          
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <h2 className="font-display text-headline-md text-primary">Quick actions</h2>
            <ul className="mt-4 space-y-4 text-body-sm text-muted">
              <li>
                <Link href="/communities" className="flex items-center gap-3 cursor-pointer hover:text-primary transition">
                  <span className="material-symbols-outlined text-secondary text-[22px]">groups</span>
                  Invite members & manage RSVPs
                </Link>
              </li>
              <li>
                <Link href="/generate" className="flex items-center gap-3 cursor-pointer hover:text-primary transition">
                  <span className="material-symbols-outlined text-secondary text-[22px]">description</span>
                  AI Minutes Generator (Upload)
                </Link>
              </li>
              <li>
                <Link href="/live" className="flex items-center gap-3 cursor-pointer hover:text-primary transition">
                  <span className="material-symbols-outlined text-secondary text-[22px]">bolt</span>
                  Live meeting capture (WebSocket)
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="flex items-center gap-3 cursor-pointer hover:text-primary transition">
                  <span className="material-symbols-outlined text-secondary text-[22px]">leaderboard</span>
                  View platform analytics
                </Link>
              </li>
            </ul>
          </motion.article>
        </div>
      </div>
    </>
  );
}
