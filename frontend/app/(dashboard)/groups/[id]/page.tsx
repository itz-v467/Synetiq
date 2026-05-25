"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";

export default function GroupDashboardPage() {
  const params = useParams();
  const groupId = params.id as string;

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/groups/${groupId}`));
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["group-dashboard", groupId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/groups/${groupId}/dashboard`));
      return res.ok ? res.json() : {};
    },
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/meetings"));
      return res.ok ? res.json() : [];
    },
  });

  const groupMeetings = meetings.filter((m: { group_id: number }) => String(m.group_id) === groupId);

  return (
    <div className="space-y-8">
      <div>
        {group?.community_id && (
          <Link href={`/communities/${group.community_id}`} className="text-body-sm text-muted hover:text-primary">
            ← Back to community
          </Link>
        )}
        <h1 className="font-display text-display-md text-primary mt-2">
          {groupLoading ? "Loading…" : group?.name || "Group"}
        </h1>
        {group?.description && <p className="text-body-md text-muted mt-1">{group.description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total meetings", stats?.total_meetings ?? 0],
          ["Upcoming", stats?.upcoming_meetings ?? 0],
          ["Completed", stats?.completed_meetings ?? 0],
          ["Members", stats?.member_count ?? 0],
        ].map(([label, value]) => (
          <div key={label as string} className="glass-card rounded-2xl p-5">
            <p className="text-label-sm text-muted">{label}</p>
            <p className="text-headline-lg font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>
      <section className="glass-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-headline-sm font-bold text-primary">Meetings</h2>
          <Link href="/meetings" className="btn-primary text-sm px-4 py-2">
            Schedule meeting
          </Link>
        </div>
        {groupMeetings.length === 0 ? (
          <p className="text-muted">No meetings in this group yet.</p>
        ) : (
          <ul className="space-y-2">
            {groupMeetings.map((m: { id: number; title: string; status: string; meeting_date: string }) => (
              <li key={m.id}>
                <Link href={`/meetings/${m.id}`} className="flex justify-between rounded-xl px-4 py-3 hover:bg-surface-container-high">
                  <span>{m.title}</span>
                  <span className="text-muted text-body-sm">{m.status} · {m.meeting_date}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
