"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { readApiError } from "@/lib/api-errors";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
// @ts-ignore
import { createPortal } from "react-dom";

export default function CommunitiesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCommName, setNewCommName] = useState("");
  const [newCommDesc, setNewCommDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log("[CommunitiesPage] Mounted");
  }, []);

  const { data: communities, isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      console.log("[CommunitiesPage] Fetching communities...");
      const res = await fetchWithAuth(apiUrl("/api/v1/communities"));
      if (!res.ok) {
        console.error("[CommunitiesPage] Failed to fetch communities:", res.status);
        throw new Error("Failed to fetch communities");
      }
      const data = await res.json();
      console.log("[CommunitiesPage] Fetched communities:", data);
      return data;
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[CommunitiesPage] handleCreate called, name:", newCommName, "description:", newCommDesc);
    setLoading(true);
    try {
      const res = await fetchWithAuth(apiUrl("/api/v1/communities"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCommName, description: newCommDesc }),
      });
      console.log("[CommunitiesPage] Create community response status:", res.status);
      if (res.ok) {
        console.log("[CommunitiesPage] Community created successfully");
        setIsModalOpen(false);
        setNewCommName("");
        setNewCommDesc("");
        queryClient.invalidateQueries({ queryKey: ["communities"] });
      } else {
        const errorText = await readApiError(res, "Failed to create community");
        console.error("[CommunitiesPage] Create community failed:", errorText);
        alert(errorText);
      }
    } catch (err) {
      console.error("[CommunitiesPage] Error creating community:", err);
      alert("Error creating community");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    console.log("[CommunitiesPage] handleDelete called for community id:", id);
    if (!confirm("Are you sure you want to archive this community?")) {
      console.log("[CommunitiesPage] Delete cancelled by user");
      return;
    }
    try {
      const res = await fetchWithAuth(apiUrl(`/api/v1/communities/${id}`), { method: "DELETE" });
      console.log("[CommunitiesPage] Delete community response status:", res.status);
      if (res.ok) {
        console.log("[CommunitiesPage] Community archived successfully");
        queryClient.invalidateQueries({ queryKey: ["communities"] });
      } else {
        const err = await res.json();
        console.error("[CommunitiesPage] Delete community failed:", err);
        alert(err.detail || "Failed to archive community");
      }
    } catch (err) {
      console.error("[CommunitiesPage] Error archiving community:", err);
      alert("Error archiving community");
    }
  };

  console.log("[CommunitiesPage] Render - isModalOpen:", isModalOpen, "mounted:", mounted);

  const modalPortal = mounted && typeof document !== "undefined"
    ? createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 70,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                onClick={() => {
                  console.log("[CommunitiesPage] Backdrop clicked, closing modal");
                  setIsModalOpen(false);
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md rounded-3xl bg-surface p-8 shadow-2xl z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-headline-md text-primary">Create Community</h2>
                  <button
                    onClick={() => {
                      console.log("[CommunitiesPage] Modal close button clicked");
                      setIsModalOpen(false);
                    }}
                    className="rounded-full p-2 hover:bg-surface-container-high transition"
                  >
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
                    <button
                      type="button"
                      onClick={() => {
                        console.log("[CommunitiesPage] Modal cancel button clicked");
                        setIsModalOpen(false);
                      }}
                      className="btn-secondary flex-1 py-3 text-label-md font-bold"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-label-md font-bold">
                      {loading ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-display-xl text-primary">Communities</h1>
          <p className="mt-1 text-body-lg text-muted">Manage your communities and groups.</p>
        </div>
        <button
          onClick={() => {
            console.log("[CommunitiesPage] New Community button clicked");
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
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

      {modalPortal}
    </section>
  );
}
