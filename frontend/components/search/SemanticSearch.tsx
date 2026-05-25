"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";
import { readApiError } from "@/lib/api-errors";

export function SemanticSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (searchText?: string) => {
    const q = searchText ?? query;
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setError("");
    try {
      const res = await fetchWithAuth(apiUrl(`/api/v1/search?q=${encodeURIComponent(q)}`));
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        setResults([]);
        setError(await readApiError(res, "Search failed"));
      }
    } catch (err) {
      console.error(err);
      setResults([]);
      setError("Network error during search");
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when initialQuery is provided
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="space-y-8">
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative group">
        <div className="flex h-16 w-full items-center gap-4 rounded-3xl bg-surface-container-high px-6 shadow-sm transition-all focus-within:ring-2 focus-within:ring-lime/50">
          <span className="material-symbols-outlined text-secondary text-[28px]">search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about past meetings (e.g. 'What was decided about the budget?')"
            className="flex-1 border-0 bg-transparent text-body-lg text-primary placeholder:text-muted focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
              className="text-muted hover:text-primary transition"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
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
                  {result.type || "mom"} · {result.title || `#${result.id}`}
                </span>
                {typeof result.score === "number" && (
                  <span className="text-label-sm text-muted">Relevance: {result.score.toFixed(2)}</span>
                )}
              </div>
              <p className="text-body-md text-primary leading-relaxed">
                {result.snippet}
                {result.snippet && result.snippet.length > 120 ? "…" : ""}
              </p>
              <div className="mt-4 flex gap-2">
                {result.url_path && (
                  <Link href={result.url_path} className="text-label-md text-lime font-bold hover:underline transition">
                    Open
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {error && <p className="text-body-md text-error text-center py-4">{error}</p>}

        {searched && !loading && results.length === 0 && !error && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[48px] text-muted mb-4">search_off</span>
            <p className="text-body-lg text-muted">No relevant information found in the knowledge base.</p>
            <p className="text-body-sm text-muted mt-2">Try a different query, or generate and publish Minutes first to build the knowledge base.</p>
          </div>
        )}

        {!searched && !loading && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[48px] text-muted mb-4">psychology</span>
            <p className="text-body-lg text-muted">Enter a query above to search through your meeting knowledge base.</p>
            <p className="text-body-sm text-muted mt-2">Powered by vector embeddings from published Minutes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
