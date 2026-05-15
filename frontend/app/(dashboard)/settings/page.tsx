"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth, clearToken } from "@/lib/auth";
import { apiUrl } from "@/lib/api";

export default function SettingsPage() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/auth/me"));
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const handleLogout = () => {
    clearToken();
    window.location.href = "/login";
  };

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-display-xl text-primary">Settings</h1>
        <p className="mt-2 text-body-lg text-muted">Manage your profile, preferences, and security.</p>
      </div>

      <div className="glass-card rounded-3xl p-8 space-y-8 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-headline-sm font-semibold text-primary border-b border-line-subtle pb-2">Profile Information</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-label-md font-semibold text-muted">Full Name</label>
              <input
                disabled
                value={user?.full_name || ""}
                className="w-full rounded-2xl border-line-subtle bg-surface-container-high px-4 py-3 text-body-md opacity-70"
              />
            </div>
            <div className="space-y-2">
              <label className="text-label-md font-semibold text-muted">Email Address</label>
              <input
                disabled
                value={user?.email || ""}
                className="w-full rounded-2xl border-line-subtle bg-surface-container-high px-4 py-3 text-body-md opacity-70"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-headline-sm font-semibold text-primary border-b border-line-subtle pb-2">Preferences</h2>
          <div className="space-y-2 max-w-xs">
            <label className="text-label-md font-semibold text-primary">Language Preference</label>
            <select className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition">
              <option value="en">English (EN)</option>
              <option value="hi">Hindi (HI)</option>
              <option value="gu">Gujarati (GU)</option>
            </select>
          </div>
        </div>

        <div className="pt-8 flex justify-end gap-4 border-t border-line-subtle">
          <button onClick={handleLogout} className="rounded-pill bg-error/10 text-error px-6 py-2 font-bold hover:bg-error/20 transition">
            Sign out
          </button>
          <button onClick={() => alert("Settings saved!")} className="btn-primary">Save changes</button>
        </div>
      </div>
    </section>
  );
}
