"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface Meeting {
  id: number;
  title: string;
  organizer_id: number;
  status: string;
  meeting_date: string;
  location: string;
  start_time?: string;
}

const NEXT_ACTIONS: Record<string, { label: string; to_status: string; icon: string }[]> = {
  DRAFT: [{ label: "Publish & Send Invites", to_status: "PUBLISHED", icon: "send" }],
  PUBLISHED: [{ label: "Start Meeting", to_status: "LIVE", icon: "play_arrow" }],
  LIVE: [
    { label: "End Meeting", to_status: "ENDED", icon: "stop" },
    { label: "Revert to Published", to_status: "PUBLISHED", icon: "undo" },
  ],
  ENDED: [{ label: "Archive", to_status: "ARCHIVED", icon: "archive" }],
  ARCHIVED: [],
};

export function MeetingsTable({ meetings }: { meetings: Meeting[] }) {
  const qc = useQueryClient();
  const [menuId, setMenuId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const transition = async (id: number, toStatus: string) => {
    setBusy(id);
    try {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${id}/transition`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_status: toStatus }),
      });
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["meetings"] });
        qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
        qc.invalidateQueries({ queryKey: ["admin-analytics"] });
      } else {
        const err = await res.json();
        alert(err.detail || "Transition failed");
      }
    } catch { alert("Network error"); }
    finally { setBusy(null); setMenuId(null); }
  };

  if (!meetings || meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line-subtle/50 bg-gradient-to-b from-surface-container/20 to-transparent p-16 text-center">
        <div className="h-20 w-20 flex items-center justify-center rounded-full bg-surface-container-high mb-6 shadow-inner">
          <span className="material-symbols-outlined text-muted text-[48px]">event_busy</span>
        </div>
        <h3 className="text-headline-md text-primary drop-shadow-md">No meetings scheduled</h3>
        <p className="mt-2 text-body-lg text-muted max-w-md">Get your community together. Create your first meeting to start generating AI insights.</p>
        <button onClick={() => window.dispatchEvent(new Event('open-new-meeting'))} className="btn-primary mt-8">Schedule a meeting</button>
      </div>
    );
  }

  return (
    <div className="overflow-visible rounded-3xl border border-line-subtle/40 bg-surface-container-low/60 shadow-glass backdrop-blur-md">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low border-b border-line-subtle/40 text-label-md text-muted uppercase tracking-wider">
            <th className="px-8 py-5 font-bold">Title</th>
            <th className="px-8 py-5 font-bold">Date</th>
            <th className="px-8 py-5 font-bold">Status</th>
            <th className="px-8 py-5 font-bold">Location</th>
            <th className="px-8 py-5 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-subtle/20">
          {meetings.map((meeting, i) => {
            const actions = NEXT_ACTIONS[meeting.status] || [];
            return (
              <motion.tr
                key={meeting.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group transition-all duration-300 hover:bg-surface-container-high/40 hover:shadow-inner"
              >
                <td className="px-8 py-6">
                  <p className="text-body-lg font-bold text-primary group-hover:text-lime transition-colors">{meeting.title}</p>
                </td>
                <td className="px-8 py-6 text-body-md text-muted font-medium">{meeting.meeting_date}</td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-label-caps font-bold tracking-widest ${
                    meeting.status === 'LIVE' ? 'bg-lime/20 text-lime shadow-[0_0_10px_rgba(198,255,77,0.2)]' :
                    meeting.status === 'PUBLISHED' ? 'bg-blue-500/20 text-blue-400' :
                    meeting.status === 'ENDED' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-surface-container-highest text-muted'
                  }`}>
                    {meeting.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-body-md text-muted">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] opacity-70">location_on</span>
                    {meeting.location}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="relative flex items-center justify-end gap-3">
                    {actions.length > 0 && (
                      <button
                        onClick={() => transition(meeting.id, actions[0].to_status)}
                        disabled={busy === meeting.id}
                        title={actions[0].label}
                        className="rounded-full p-2 text-muted transition-all hover:bg-lime/10 hover:text-lime hover:scale-110 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {busy === meeting.id ? "hourglass_top" : actions[0].icon}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => setMenuId(menuId === meeting.id ? null : meeting.id)}
                      className="rounded-full p-2 text-muted transition-all hover:bg-surface-container-highest hover:text-primary hover:scale-110"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>

                    <AnimatePresence>
                      {menuId === meeting.id && (
                        <motion.div
                          ref={menuRef}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 z-50 w-56 rounded-2xl bg-surface border border-line-subtle/40 shadow-xl py-2"
                        >
                          {actions.map((a) => (
                            <button
                              key={a.to_status}
                              onClick={() => transition(meeting.id, a.to_status)}
                              disabled={busy === meeting.id}
                              className="flex w-full items-center gap-3 px-4 py-3 text-body-sm text-primary hover:bg-surface-container-high transition"
                            >
                              <span className="material-symbols-outlined text-[18px] text-secondary">{a.icon}</span>
                              {a.label}
                            </button>
                          ))}
                          {actions.length > 0 && <hr className="my-1 border-line-subtle/30" />}
                          <button
                            onClick={() => { setMenuId(null); alert(`Meeting: ${meeting.title}\nDate: ${meeting.meeting_date}\nTime: ${meeting.start_time || "N/A"}\nLocation: ${meeting.location}\nStatus: ${meeting.status}`); }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-body-sm text-primary hover:bg-surface-container-high transition"
                          >
                            <span className="material-symbols-outlined text-[18px] text-secondary">info</span>
                            View Details
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
