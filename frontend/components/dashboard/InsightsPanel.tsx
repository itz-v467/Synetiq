"use client";

import { motion } from "framer-motion";

export function InsightsPanel({ insights }: { insights: string[] }) {
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card flex flex-col rounded-2xl p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">auto_awesome</span>
        <h2 className="font-display text-headline-sm text-primary">AI Insights</h2>
      </div>
      <ul className="space-y-4">
        {insights.map((insight, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 rounded-xl bg-surface-container-low p-3 transition hover:bg-surface-container-high"
          >
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
            <p className="text-body-sm text-on-surface">{insight}</p>
          </motion.li>
        ))}
      </ul>
    </motion.article>
  );
}
