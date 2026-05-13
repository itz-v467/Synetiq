"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

export default function HomePage() {
  const [health, setHealth] = useState<string>("checking");

  useEffect(() => {
    fetch(apiUrl("/health"))
      .then((r) => r.json())
      .then((d) => {
        const ollama = d.ollama === "running";
        setHealth(ollama ? "ready" : "degraded");
      })
      .catch(() => setHealth("offline"));
  }, []);

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

      <section className="glass-card mb-8 flex flex-wrap items-center gap-3 rounded-pill p-2 pl-6 shadow-sm">
        <span className="material-symbols-outlined text-line">search</span>
        <input className="min-w-0 flex-1 border-0 bg-transparent text-body-md focus:ring-0" placeholder="Search past meetings, decisions, or owners…" readOnly />
        <div className="hidden h-8 w-px bg-line-subtle/40 sm:block" />
        <div className="flex flex-wrap gap-2">
          <span className="rounded-pill bg-surface-container-highest px-4 py-2 text-label-caps text-on-surface-variant">Date range</span>
          <span className="rounded-pill bg-surface-container-highest px-4 py-2 text-label-caps text-on-surface-variant">Community</span>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-pill bg-primary text-primary-foreground" aria-label="Filters">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-xl p-6 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-headline-md text-primary">System status</h2>
            <span
              className={
                health === "ready"
                  ? "relative flex h-3 w-3"
                  : health === "degraded"
                    ? "relative flex h-3 w-3"
                    : "relative flex h-3 w-3"
              }
            >
              <span
                className={
                  health === "ready"
                    ? "absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-40"
                    : "absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"
                }
              />
              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${health === "ready" ? "bg-lime" : health === "degraded" ? "bg-amber-400" : "bg-error"}`}
              />
            </span>
          </div>
          <p className="text-body-md text-muted">
            {health === "ready" && "API and core services reachable. Ollama reports running for on-device MOM generation."}
            {health === "degraded" && "API is up; Ollama may be offline—start `ollama serve` on the host for full AI."}
            {health === "offline" && "Could not reach /health. Confirm `docker compose up` and nginx on port 8080."}
            {health === "checking" && "Checking backend health…"}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/docs" className="btn-primary inline-block text-center">
              Open API docs
            </a>
            <a href="/legacy/mom" className="btn-ai-primary inline-block text-center">
              Legacy MOM tool
            </a>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6"
        >
          <h2 className="font-display text-headline-md text-primary">Quick actions</h2>
          <ul className="mt-4 space-y-3 text-body-sm text-muted">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">groups</span>
              Invite members & manage RSVPs
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">description</span>
              Publish minutes to semantic index
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">bolt</span>
              Live meeting capture (WebSocket)
            </li>
          </ul>
        </motion.article>
      </div>
    </>
  );
}
