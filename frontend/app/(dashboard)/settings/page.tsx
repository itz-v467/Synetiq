"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth, clearToken } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { readApiError } from "@/lib/api-errors";
import { canManageUsers } from "@/lib/permissions";
import { UserManagement } from "@/components/settings/UserManagement";
import { motion, AnimatePresence } from "framer-motion";

function TabBtn({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-3 px-5 font-bold text-label-md border-b-2 transition ${
        active ? "border-primary text-primary" : "border-transparent text-muted hover:text-primary"
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "system" | "users">("profile");
  const [language, setLanguage] = useState("en");
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const qc = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/auth/me"));
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  useEffect(() => {
    if (user?.language_preference) setLanguage(user.language_preference);
  }, [user?.language_preference]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const res = await fetchWithAuth(apiUrl("/auth/me"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language_preference: language }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to save"));
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      setSaveMsg("Preferences saved.");
      setSaveErr("");
    },
    onError: (e: Error) => {
      setSaveErr(e.message);
      setSaveMsg("");
    },
  });

  const { data: healthData } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const r = await fetch(apiUrl("/health"));
      if (!r.ok) throw new Error("Health check failed");
      return r.json();
    },
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    clearToken();
    window.location.href = "/login";
  };

  const health = healthData?.ollama === "running" ? "ready" : healthData ? "degraded" : "offline";

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <motion.div>
        <h1 className="font-display text-display-xl text-primary">Settings</h1>
        <p className="mt-2 text-body-lg text-muted">Manage your profile, system preferences, and security.</p>
      </motion.div>

      <div className="flex gap-0 border-b border-line-subtle overflow-x-auto">
        <TabBtn label="Profile Settings" icon="person" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
        <TabBtn label="System Status" icon="monitor_heart" active={activeTab === "system"} onClick={() => setActiveTab("system")} />
        {canManageUsers(user?.capabilities) && (
          <TabBtn label="User Management" icon="admin_panel_settings" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-card rounded-3xl p-8 space-y-8 shadow-sm"
        >
          {activeTab === "profile" && (
            <>
              <div className="space-y-4">
                <h2 className="text-headline-sm font-semibold text-primary border-b border-line-subtle pb-2">Profile Information</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-label-md font-semibold text-muted">Full Name</label>
                    <input disabled value={user?.full_name || ""} className="w-full rounded-2xl border border-line-subtle bg-surface-container-high px-4 py-3 text-body-md opacity-70" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-label-md font-semibold text-muted">Email Address</label>
                    <input disabled value={user?.email || ""} className="w-full rounded-2xl border border-line-subtle bg-surface-container-high px-4 py-3 text-body-md opacity-70" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-label-md font-semibold text-muted">Role</label>
                    <motion.div className="w-full rounded-2xl border border-line-subtle bg-surface-container-high px-4 py-3 text-body-md font-bold text-lime opacity-80">
                      {user?.role || "USER"}
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-headline-sm font-semibold text-primary border-b border-line-subtle pb-2">Preferences</h2>
                <div className="space-y-2 max-w-xs">
                  <label className="text-label-md font-semibold text-primary">Language Preference</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:outline-none transition"
                  >
                    <option value="en">English (EN)</option>
                    <option value="hi">Hindi (HI)</option>
                    <option value="gu">Gujarati (GU)</option>
                  </select>
                </div>
              </div>

              {saveMsg && <p className="text-body-sm text-lime">{saveMsg}</p>}
              {saveErr && <p className="text-body-sm text-error">{saveErr}</p>}

              <div className="pt-8 flex justify-end gap-4 border-t border-line-subtle">
                <button onClick={handleLogout} className="rounded-pill bg-error/10 text-error px-6 py-2 font-bold hover:bg-error/20 transition">
                  Sign out
                </button>
                <button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending} className="btn-primary px-6 py-2 disabled:opacity-50">
                  {saveProfile.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </>
          )}

          {activeTab === "system" && (
            <div className="space-y-6">
              <motion.div className="mb-4 flex items-center justify-between border-b border-line-subtle pb-2">
                <h2 className="font-display text-headline-sm font-semibold text-primary">System Health Overview</h2>
                <span className={`h-3 w-3 rounded-full ${health === "ready" ? "bg-lime" : health === "degraded" ? "bg-amber-400" : "bg-error"}`} />
              </motion.div>
              <p className="text-body-md text-muted">
                {health === "ready" && "API and core services reachable."}
                {health === "degraded" && "API is up; Ollama may be offline."}
                {health === "offline" && "Could not reach /health. Confirm docker compose is running."}
              </p>
              {healthData && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {Object.entries(healthData)
                    .filter(([k]) => k !== "status")
                    .map(([key, val]) => (
                      <div key={key} className="rounded-2xl border border-line-subtle bg-surface-container-low p-4 min-w-[160px]">
                        <span className="text-label-sm text-muted uppercase">{key}</span>
                        <p className="text-label-md font-bold text-primary mt-1">{String(val)}</p>
                      </div>
                    ))}
                </div>
              )}
              <a href="/docs" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-block">
                Open API Diagnostics (Swagger)
              </a>
            </div>
          )}

          {activeTab === "users" && canManageUsers(user?.capabilities) && user && (
            <UserManagement
              currentUserId={user.id}
              currentRole={user.role}
              canAssignSuperadmin={user.capabilities?.can_assign_superadmin}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
