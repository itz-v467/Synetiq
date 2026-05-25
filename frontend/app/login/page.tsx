"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { readApiError } from "@/lib/api-errors";
import { setToken } from "@/lib/auth";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@synetiq.ai");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        if (res.status === 502 || text.includes("<html")) {
          throw new Error(
            "API is not reachable. Run: docker compose ps (api should be Up). Then: docker compose up -d --build api"
          );
        }
        throw new Error(`Server returned non-JSON response (${res.status}). Is the API running?`);
      }

      if (!res.ok) {
        throw new Error(await readApiError(res, "Login failed"));
      }

      const data = await res.json();
      setToken(data.access_token, data.refresh_token);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <h1 className="font-display text-display-md font-bold text-primary">Synetiq</h1>
          <p className="mt-2 text-body-md text-muted">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-label-md font-semibold text-primary">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition"
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-label-md font-semibold text-primary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-body-sm font-medium text-error">
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-body-md font-bold shadow-lg shadow-lime/20">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-center text-body-sm text-muted">
          Superadmin: admin@synetiq.ai / admin123
        </p>
      </motion.div>
    </motion.div>
  );
}
