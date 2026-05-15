"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(apiUrl(`/api/v1/search?q=${encodeURIComponent(query)}`));
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSearch} className="relative group">
        <div className="flex h-16 w-full items-center gap-4 rounded-3xl bg-surface-container-high px-6 shadow-sm transition-all focus-within:ring-2 focus-within:ring-lime/50">
          <span className="material-symbols-outlined text-secondary text-[28px]">search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about past meetings (e.g. 'What was decided about the budget?')"
            className="flex-1 border-0 bg-transparent text-body-lg text-primary placeholder:text-muted focus:ring-0"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex h-10 w-10 items-center justify-center rounded-full"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            )}
          </button>
        </div>
      </form>

      <div className="space-y-6">
        <AnimatePresence>
          {results.map((result, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 hover:bg-surface-container-low transition"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-label-md text-secondary font-semibold uppercase tracking-wider">
                  MOM #{result.mom_id}
                </span>
                <span className="text-label-sm text-muted">Match score: {Math.round((1 - result.score) * 100)}%</span>
              </div>
              <p className="text-body-md text-primary leading-relaxed">
                {result.snippet}...
              </p>
              <div className="mt-4 flex gap-2">
                <button className="text-label-md text-lime font-bold hover:underline transition">
                  View full document
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {query && !loading && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-body-lg text-muted">No relevant information found in the knowledge base.</p>
          </div>
        )}
      </div>
    </div>
  );
}
