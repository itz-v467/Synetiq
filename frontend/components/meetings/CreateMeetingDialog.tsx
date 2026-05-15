"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export function CreateMeetingDialog({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [location, setLocation] = useState("Main Hall / Zoom");
  const [communityId, setCommunityId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: communities } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/communities"));
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["groups", communityId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/groups/community/${communityId}`));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!communityId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) {
      alert("Please select a group");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithAuth(apiUrl("/api/v1/meetings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: Number(groupId),
          title,
          meeting_date: date,
          start_time: time,
          expected_duration_minutes: 60,
          location,
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
        setTitle("");
        setCommunityId("");
        setGroupId("");
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create meeting");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: "-40%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-40%", x: "-50%" }}
            className="fixed left-1/2 top-1/2 z-[70] w-full max-w-lg rounded-3xl bg-surface p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-headline-md text-primary">Schedule Meeting</h2>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-surface-container-high transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-foreground">Community</label>
                  <select
                    required
                    value={communityId}
                    onChange={(e) => { setCommunityId(e.target.value); setGroupId(""); }}
                    className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition"
                  >
                    <option value="">Select Community</option>
                    {communities?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-foreground">Group</label>
                  <select
                    required
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    disabled={!communityId}
                    className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition disabled:opacity-50"
                  >
                    <option value="">Select Group</option>
                    {groups?.map((g: any) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label-md font-semibold text-foreground">Meeting Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition"
                  placeholder="e.g. Monthly Review"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-foreground">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-foreground">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label-md font-semibold text-foreground">Location</label>
                <input
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition"
                  placeholder="e.g. Conference Room B"
                />
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3 text-label-md font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-label-md font-bold">
                  {loading ? "Creating..." : "Create Meeting"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

