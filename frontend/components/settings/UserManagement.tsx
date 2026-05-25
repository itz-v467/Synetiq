"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { readApiError } from "@/lib/api-errors";
import { isSuperadmin } from "@/lib/permissions";

const ROLES = ["PARTICIPANT", "ORGANIZER", "ADMIN", "SUPERADMIN"] as const;

type UserRow = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
};

export function UserManagement({
  currentUserId,
  currentRole,
  canAssignSuperadmin,
}: {
  currentUserId: number;
  currentRole: string;
  canAssignSuperadmin?: boolean;
}) {
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["auth-users"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/auth/users"));
      if (!res.ok) throw new Error(await readApiError(res, "Failed to load users"));
      return (await res.json()) as UserRow[];
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await fetchWithAuth(apiUrl(`/auth/users/${userId}/role?role=${role}`), { method: "PATCH" });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to update role"));
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-users"] });
      setMessage("Role updated.");
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchWithAuth(apiUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: inviteName,
          email: inviteEmail,
          password: invitePassword,
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to create user"));
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-users"] });
      setInviteEmail("");
      setInviteName("");
      setInvitePassword("");
      setMessage("User invited (registered). Assign a role if needed.");
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const assignableRoles = ROLES.filter((r) => r !== "SUPERADMIN" || canAssignSuperadmin);

  return (
    <div className="space-y-6">
      {message && <p className="text-body-sm text-lime font-medium">{message}</p>}
      {error && <p className="text-body-sm text-error font-medium">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (inviteName.length < 2 || invitePassword.length < 8) {
            setError("Name and password (8+ chars) required.");
            return;
          }
          inviteMutation.mutate();
        }}
        className="glass-card rounded-2xl p-6 space-y-4 border border-line-subtle"
      >
        <h3 className="text-headline-sm font-semibold text-primary">Invite user</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            required
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Full name"
            className="rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-2.5 text-body-md"
          />
          <input
            required
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@company.com"
            className="rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-2.5 text-body-md"
          />
          <input
            required
            type="password"
            minLength={8}
            value={invitePassword}
            onChange={(e) => setInvitePassword(e.target.value)}
            placeholder="Temp password (8+)"
            className="rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-2.5 text-body-md"
          />
        </div>
        <button type="submit" disabled={inviteMutation.isPending} className="btn-primary text-sm px-5 py-2">
          {inviteMutation.isPending ? "Creating…" : "Create account"}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-line-subtle">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-high text-muted">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle bg-surface">
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-muted">
                  Loading users…
                </td>
              </tr>
            )}
            {!isLoading &&
              users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-low transition">
                  <td className="px-6 py-4 font-medium text-primary">{u.full_name}</td>
                  <td className="px-6 py-4 text-muted">{u.email}</td>
                  <td className="px-6 py-4">
                    {u.id === currentUserId && isSuperadmin(u.role) ? (
                      <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-label-sm font-bold text-primary">
                        {u.role}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={roleMutation.isPending || (u.role === "SUPERADMIN" && !isSuperadmin(currentRole))}
                        onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value })}
                        className="rounded-xl border border-line-subtle bg-surface-container-low px-3 py-1.5 text-body-sm"
                      >
                        {assignableRoles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                        {!assignableRoles.includes(u.role as (typeof ROLES)[number]) && (
                          <option value={u.role}>{u.role}</option>
                        )}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="text-label-sm text-muted">{users.length} user(s). Role changes apply immediately.</p>
    </div>
  );
}
