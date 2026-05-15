"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CommunitiesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCommName, setNewCommName] = useState("");
  const [newCommDesc, setNewCommDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: communities, isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/communities"));
      if (!res.ok) throw new Error("Failed to fetch communities");
      return res.json();
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth(apiUrl("/api/v1/communities"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCommName, description: newCommDesc }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewCommName("");
        setNewCommDesc("");
        queryClient.invalidateQueries({ queryKey: ["communities"] });
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create community");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating community");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetchWithAuth(apiUrl(`/api/v1/communities/${id}`), { method: "DELETE" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["communities"] });
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to archive community");
      }
    } catch { alert("Error archiving community"); }
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-display-xl text-primary">Communities</h1>
          <p className="mt-1 text-body-lg text-muted">Manage your communities and groups.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Community
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 w-full animate-pulse rounded-3xl bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {communities?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted">
              <span className="material-symbols-outlined text-[48px] mb-4">groups</span>
              <p>No communities found. Create one to get started!</p>
            </div>
          )}
          
          {communities?.map((community: any) => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-6 flex flex-col"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-headline-sm font-bold text-primary">{community.name}</h3>
                  <p className="text-body-sm text-muted">/{community.slug}</p>
                </div>
                <button
                  onClick={() => handleDelete(community.id)}
                  className="rounded-full p-1.5 text-muted hover:bg-error/10 hover:text-error transition"
                  title="Archive community"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              <p className="text-body-md text-on-surface-variant flex-1 mb-6">
                {community.description || "No description provided."}
              </p>
              <div className="flex items-center justify-between border-t border-line-subtle pt-4">
                <span className="text-label-sm text-muted">{new Date(community.created_at).toLocaleDateString()}</span>
                <Link href={`/communities/${community.id}`} className="text-label-md text-lime font-bold hover:underline transition">
                  Manage groups
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-[70] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-surface p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-headline-md text-primary">Create Community</h2>
                <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-surface-container-high transition">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-primary">Community Name</label>
                  <input
                    required
                    value={newCommName}
                    onChange={(e) => setNewCommName(e.target.value)}
                    className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition"
                    placeholder="e.g. Core Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-primary">Description</label>
                  <textarea
                    value={newCommDesc}
                    onChange={(e) => setNewCommDesc(e.target.value)}
                    className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition"
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>

                <div className="mt-8 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1 py-3 text-label-md font-bold">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-label-md font-bold">
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
