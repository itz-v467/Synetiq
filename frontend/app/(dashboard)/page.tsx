"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/services/analytics";
import { StatsGrid } from "@/components/dashboard/StatsGrid";

export default function HomePage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

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

      <div className="grid gap-6">
        <div className="space-y-6">
          
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
                <Link href="/meetings" className="flex items-center gap-3 cursor-pointer hover:text-primary transition">
                  <span className="material-symbols-outlined text-secondary text-[22px]">event_note</span>
                  Schedule a meeting & generate MOM
                </Link>
              </li>
              <li>
                <Link href="/search" className="flex items-center gap-3 cursor-pointer hover:text-primary transition">
                  <span className="material-symbols-outlined text-secondary text-[22px]">search</span>
                  Search Meeting Records
                </Link>
              </li>
            </ul>
          </motion.article>
        </div>
      </div>
    </>
  );
}
