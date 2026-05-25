"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/notifications"));
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 60000,
  });

  return (
    <div className="absolute right-0 top-full mt-2 z-[60] w-80 max-h-96 overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-xl">
      <div className="flex items-center justify-between border-b border-line-subtle px-4 py-3">
        <span className="text-label-md font-bold text-primary">Notifications</span>
        <button type="button" onClick={onClose} className="text-muted hover:text-primary">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div className="overflow-y-auto max-h-80 p-2">
        {isLoading && <p className="p-4 text-body-sm text-muted">Loading…</p>}
        {!isLoading && items.length === 0 && (
          <p className="p-4 text-body-sm text-muted">No notifications yet. Meeting invites appear here when sent.</p>
        )}
        {items.map((n: { id: number; subject: string; category: string; status: string; created_at: string }) => (
          <div key={n.id} className="rounded-xl px-3 py-2.5 hover:bg-surface-container-low">
            <p className="text-body-sm font-medium text-primary">{n.subject}</p>
            <p className="text-label-sm text-muted">
              {n.category} · {n.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
