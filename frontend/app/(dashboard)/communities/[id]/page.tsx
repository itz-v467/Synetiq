"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";

function CommunityMembersList({ communityId }: { communityId: string }) {
  const { data: members, isLoading } = useQuery({
    queryKey: ["community-members", communityId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/communities/${communityId}/members`));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) return <div className="h-12 bg-surface-container-low rounded-xl animate-pulse mt-4"></div>;
  if (!members?.length) return <p className="text-muted mt-4">No members yet.</p>;

  return (
    <div className="space-y-3 mt-6">
      {members.map((m: any) => (
        <div key={m.user_id} className="flex items-center justify-between p-4 glass-card rounded-2xl">
          <div>
            <p className="font-semibold text-primary">{m.full_name}</p>
            <p className="text-sm text-muted">{m.email}</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest bg-lime/20 text-secondary px-3 py-1 rounded-full">{m.role}</span>
        </div>
      ))}
    </div>
  );
}

export default function CommunityDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: communities } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/communities"));
      return res.json();
    },
  });

  const community = communities?.find((c: any) => c.id.toString() === id);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups", id],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/groups/community/${id}`));
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth(apiUrl("/api/v1/groups"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community_id: Number(id),
          name: newGroupName,
          description: newGroupDesc,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewGroupName("");
        setNewGroupDesc("");
        queryClient.invalidateQueries({ queryKey: ["groups", id] });
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create group");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <button onClick={() => router.push("/communities")} className="flex items-center gap-2 text-label-md font-bold text-muted hover:text-primary transition">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Communities
      </button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-display-xl text-primary">{community?.name || "Loading..."}</h1>
          <p className="mt-1 text-body-lg text-muted">Manage groups within this community.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Group
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
          {groups?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted">
              <span className="material-symbols-outlined text-[48px] mb-4">account_tree</span>
              <p>No groups found in this community. Create one!</p>
            </div>
          )}
          
          {groups?.map((group: any) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-6 flex flex-col"
            >
              <div className="mb-4">
                <h3 className="text-headline-sm font-bold text-primary">{group.name}</h3>
              </div>
              <p className="text-body-md text-on-surface-variant flex-1 mb-6">
                {group.description || "No description provided."}
              </p>
              <div className="flex items-center justify-between border-t border-line-subtle pt-4">
                <span className="text-label-sm text-muted">Created: {new Date(group.created_at).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Members Section Placeholder to satisfy PRD FR-02.2 */}
      <div className="pt-12 border-t border-line-subtle mt-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mb-8">
          <div>
            <h2 className="font-display text-headline-lg text-primary">Community Members</h2>
            <p className="mt-1 text-body-md text-muted">People who have access to this community.</p>
          </div>
          <button onClick={() => {
            const email = prompt("Enter user email to add:");
            if (email) {
              fetchWithAuth(apiUrl(`/api/v1/communities/${id}/members`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, role: "PARTICIPANT" })
              }).then(r => r.ok ? window.location.reload() : r.json().then(e => alert(e.detail || "Failed")));
            }
          }} className="btn-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Invite Members
          </button>
        </div>
        <CommunityMembersList communityId={id as string} />
      </div>

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
                <h2 className="font-display text-headline-md text-primary">Create Group</h2>
                <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-surface-container-high transition">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-primary">Group Name</label>
                  <input
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition"
                    placeholder="e.g. Design Team"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-primary">Description</label>
                  <textarea
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
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
