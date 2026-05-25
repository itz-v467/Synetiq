"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { MeetingsTable } from "@/components/meetings/MeetingsTable";
import { CreateMeetingDialog } from "@/components/meetings/CreateMeetingDialog";

const STATUSES = ["All", "DRAFT", "PUBLISHED", "LIVE", "ENDED", "ARCHIVED"];

export default function MeetingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);

  const openMeetingDialog = () => setMeetingDialogOpen(true);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/meetings"));
      if (!res.ok) throw new Error("Failed to fetch meetings");
      return res.json();
    },
  });

  const filtered = (meetings || []).filter((m: any) => {
    const matchSearch = !search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-display-xl text-primary">Meetings</h1>
          <p className="mt-1 text-body-lg text-muted">Manage your upcoming and past community sessions.</p>
        </div>
        <button onClick={openMeetingDialog} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add</span>
          New meeting
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="input-pill flex flex-1 items-center gap-2 max-w-md">
          <span className="material-symbols-outlined text-line text-[20px]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-0 bg-transparent text-body-sm focus:ring-0"
            placeholder="Filter meetings by title or location…"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted hover:text-primary transition">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-pill px-4 py-2 text-label-caps cursor-pointer transition ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {s === "All" ? "Status: All" : s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <MeetingsTable meetings={filtered} onScheduleMeeting={openMeetingDialog} />
      )}

      <CreateMeetingDialog
        isOpen={meetingDialogOpen}
        onClose={() => setMeetingDialogOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["meetings"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }}
      />
    </section>
  );
}
