"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { MeetingsTable } from "@/components/meetings/MeetingsTable";

export default function MeetingsPage() {
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/meetings"));
      if (!res.ok) throw new Error("Failed to fetch meetings");
      return res.json();
    },
  });

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-display-xl text-primary">Meetings</h1>
          <p className="mt-1 text-body-lg text-muted">Manage your upcoming and past community sessions.</p>
        </div>
        <button onClick={() => window.dispatchEvent(new Event('open-new-meeting'))} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add</span>
          New meeting
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="input-pill flex flex-1 items-center gap-2 max-w-md">
          <span className="material-symbols-outlined text-line text-[20px]">search</span>
          <input className="flex-1 border-0 bg-transparent text-body-sm focus:ring-0" placeholder="Filter meetings by title or location…" />
        </div>
        <span className="rounded-pill bg-surface-container-highest px-4 py-2 text-label-caps text-on-surface-variant cursor-pointer hover:bg-surface-container-high transition">Status: All</span>
        <span className="rounded-pill bg-surface-container-highest px-4 py-2 text-label-caps text-on-surface-variant cursor-pointer hover:bg-surface-container-high transition">Group: All</span>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <MeetingsTable meetings={meetings || []} />
      )}
    </section>
  );
}
