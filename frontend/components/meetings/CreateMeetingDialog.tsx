"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readApiError } from "@/lib/api-errors";
// @ts-ignore
import { createPortal } from "react-dom";

interface AgendaItem {
  topic: string;
  presenter: string;
  duration_minutes: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateMeetingDialog({ isOpen, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"details" | "agenda" | "people">("details");
  const [mounted, setMounted] = useState(false);
  const [quickCommName, setQuickCommName] = useState("");
  const [quickGroupName, setQuickGroupName] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingMode, setMeetingMode] = useState<"ONLINE" | "OFFLINE">("OFFLINE");
  const [durationMinutes, setDurationMinutes] = useState(60);

  // Agenda
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    { topic: "", presenter: "", duration_minutes: 15 },
  ]);

  // People
  const [communityId, setCommunityId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [extraEmails, setExtraEmails] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: communities = [], refetch: refetchCommunities } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/communities"));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen,
  });

  const { data: groups = [], refetch: refetchGroups } = useQuery({
    queryKey: ["groups", communityId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/groups/community/${communityId}`));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !!communityId,
  });

  const { data: groupMembers } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/groups/${groupId}/members`));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!groupId,
  });

  const addAgendaRow = () =>
    setAgendaItems((prev) => [...prev, { topic: "", presenter: "", duration_minutes: 15 }]);

  const removeAgendaRow = (i: number) =>
    setAgendaItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateAgenda = (i: number, field: keyof AgendaItem, value: string | number) => {
    setAgendaItems((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row))
    );
  };

  const resetForm = () => {
    setStep("details");
    setTitle(""); setDescription(""); setDate(""); setStartTime("10:00"); setEndTime("11:00"); setLocation(""); setMeetingLink("");
    setAgendaItems([{ topic: "", presenter: "", duration_minutes: 15 }]);
    setCommunityId(""); setGroupId(""); setExtraEmails("");
  };

  const handleSubmit = async () => {
    if (!groupId) { alert("Please select a group"); return; }
    if (!title || !date || !location) { alert("Title, date and location are required"); return; }
    if (meetingMode === "ONLINE" && !meetingLink) { alert("Meeting link is required for online meetings"); return; }

    setLoading(true);
    try {
      const extra = extraEmails.split(",").map((e) => e.trim()).filter(Boolean);
      const validAgenda = agendaItems.filter((a) => a.topic.trim());
      const res = await fetchWithAuth(apiUrl("/api/v1/meetings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: Number(groupId),
          title,
          description,
          meeting_date: date,
          start_time: startTime,
          end_time: endTime,
          expected_duration_minutes: durationMinutes,
          location,
          meeting_mode: meetingMode,
          meeting_link: meetingMode === "ONLINE" ? meetingLink : null,
          agenda_items: validAgenda.map((a, idx) => ({ ...a, position: idx })),
          extra_attendee_emails: extra,
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        alert(await readApiError(res, "Failed to create meeting"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const createQuickCommunity = async () => {
    if (!quickCommName.trim()) return;
    setSetupLoading(true);
    try {
      const res = await fetchWithAuth(apiUrl("/api/v1/communities"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: quickCommName.trim(), description: "" }),
      });
      if (!res.ok) {
        alert(await readApiError(res, "Failed to create community"));
        return;
      }
      const comm = await res.json();
      setCommunityId(String(comm.id));
      setQuickCommName("");
      await refetchCommunities();
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    } finally {
      setSetupLoading(false);
    }
  };

  const createQuickGroup = async () => {
    if (!communityId || !quickGroupName.trim()) return;
    setSetupLoading(true);
    try {
      const res = await fetchWithAuth(apiUrl("/api/v1/groups"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community_id: Number(communityId),
          name: quickGroupName.trim(),
          description: "Created from meeting wizard",
        }),
      });
      if (!res.ok) {
        alert(await readApiError(res, "Failed to create group"));
        return;
      }
      const grp = await res.json();
      setGroupId(String(grp.id));
      setQuickGroupName("");
      await refetchGroups();
    } finally {
      setSetupLoading(false);
    }
  };

  const totalDuration = agendaItems.reduce((s, a) => s + Number(a.duration_minutes || 0), 0);

  const steps = [
    { key: "details", label: "Details", icon: "edit_note" },
    { key: "agenda", label: "Agenda", icon: "list" },
    { key: "people", label: "People", icon: "group" },
  ] as const;

  console.log("[CreateMeetingDialog] Render - isOpen:", isOpen, "mounted:", mounted, "step:", step);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            onClick={() => {
              console.log("[CreateMeetingDialog] Backdrop clicked, closing dialog");
              onClose();
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl rounded-3xl bg-surface p-0 shadow-2xl max-h-[92vh] overflow-hidden flex flex-col z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-line-subtle/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-headline-md text-primary">Schedule Meeting</h2>
                <button
                  onClick={() => {
                    console.log("[CreateMeetingDialog] Close button clicked");
                    onClose();
                  }}
                  className="rounded-full p-2 hover:bg-surface-container-high transition"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Step pills */}
              <div className="flex gap-2">
                {steps.map((s) => {
                  const isDetailsValid = !!(title && date && location);
                  const isDisabled = (s.key === "agenda" || s.key === "people") && !isDetailsValid;

                  return (
                    <button
                      key={s.key}
                      disabled={isDisabled}
                      onClick={() => {
                        console.log(`[CreateMeetingDialog] Step pill clicked: ${s.key}`);
                        setStep(s.key);
                      }}
                      className={`flex items-center gap-2 rounded-pill px-4 py-2 text-label-md font-semibold transition ${
                        step === s.key
                          ? "bg-primary text-primary-foreground"
                          : isDisabled
                          ? "opacity-40 cursor-not-allowed bg-surface-container-high text-muted"
                          : "bg-surface-container-high text-muted hover:text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  {/* ── DETAILS STEP ── */}
                  {step === "details" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-label-md font-semibold text-foreground">Meeting Title *</label>
                        <input
                          required
                          value={title}
                          onChange={(e) => {
                            console.log("[CreateMeetingDialog] Title changed:", e.target.value);
                            setTitle(e.target.value);
                          }}
                          className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:outline-none transition"
                          placeholder="e.g. Monthly Review"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-label-md font-semibold text-foreground">Description</label>
                        <textarea
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:outline-none transition resize-none"
                          placeholder="Optional overview of the meeting…"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1 col-span-1">
                          <label className="text-label-md font-semibold text-foreground">Date *</label>
                          <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => {
                              console.log("[CreateMeetingDialog] Date changed:", e.target.value);
                              setDate(e.target.value);
                            }}
                            className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-label-md font-semibold text-foreground">Start Time *</label>
                          <input
                            type="time"
                            required
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-label-md font-semibold text-foreground">End Time</label>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <label className="text-label-md font-semibold text-foreground">Mode</label>
                          <select
                            value={meetingMode}
                            onChange={(e) => setMeetingMode(e.target.value as "ONLINE" | "OFFLINE")}
                            className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md"
                          >
                            <option value="OFFLINE">In person</option>
                            <option value="ONLINE">Online</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-label-md font-semibold text-foreground">Duration (min)</label>
                          <input
                            type="number"
                            min={15}
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-label-md font-semibold text-foreground">Location *</label>
                          <input
                            required
                            value={location}
                            onChange={(e) => {
                              console.log("[CreateMeetingDialog] Location changed:", e.target.value);
                              setLocation(e.target.value);
                            }}
                            className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:outline-none transition"
                            placeholder="e.g. Conference Room A / Online"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-label-md font-semibold text-foreground">
                            Meeting Link {meetingMode === "ONLINE" ? "*" : ""}
                          </label>
                          <input
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            disabled={meetingMode === "OFFLINE"}
                            className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:outline-none transition disabled:opacity-50"
                            placeholder="e.g. https://zoom.us/j/..."
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── AGENDA STEP ── */}
                  {step === "agenda" && (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-body-sm text-muted">Add agenda items for this meeting.</p>
                        <span className="text-label-sm text-secondary font-bold">{totalDuration} min total</span>
                      </div>

                      <div className="space-y-3">
                        {agendaItems.map((item, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-12 gap-2 items-start bg-surface-container-low rounded-2xl p-3"
                          >
                            <div className="col-span-5 space-y-1">
                              <label className="text-label-sm text-muted">Topic *</label>
                              <input
                                value={item.topic}
                                onChange={(e) => updateAgenda(i, "topic", e.target.value)}
                                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-body-sm focus:outline-none focus:border-lime"
                                placeholder="e.g. Budget review"
                              />
                            </div>
                            <div className="col-span-4 space-y-1">
                              <label className="text-label-sm text-muted">Presenter</label>
                              <input
                                value={item.presenter}
                                onChange={(e) => updateAgenda(i, "presenter", e.target.value)}
                                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-body-sm focus:outline-none focus:border-lime"
                                placeholder="Name / Role"
                              />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <label className="text-label-sm text-muted">Mins</label>
                              <input
                                type="number"
                                min={1}
                                value={item.duration_minutes}
                                onChange={(e) => updateAgenda(i, "duration_minutes", Number(e.target.value))}
                                className="w-full rounded-xl border border-line-subtle bg-surface px-3 py-2 text-body-sm focus:outline-none focus:border-lime"
                              />
                            </div>
                            <div className="col-span-1 pt-6 flex justify-center">
                              {agendaItems.length > 1 && (
                                <button
                                  onClick={() => {
                                    console.log("[CreateMeetingDialog] Removing agenda row:", i);
                                    removeAgendaRow(i);
                                  }}
                                  className="text-error hover:opacity-80 transition"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          console.log("[CreateMeetingDialog] Adding agenda row");
                          addAgendaRow();
                        }}
                        className="flex items-center gap-2 text-label-md text-lime font-semibold hover:opacity-80 transition"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Add agenda item
                      </button>
                    </>
                  )}

                  {/* ── PEOPLE STEP ── */}
                  {step === "people" && (
                    <>
                      {communities.length === 0 && (
                        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 space-y-3 mb-4">
                          <p className="text-body-sm font-semibold text-primary">Create a community first.</p>
                          <div className="flex gap-2">
                            <input
                              value={quickCommName}
                              onChange={(e) => setQuickCommName(e.target.value)}
                              placeholder="Community name"
                              className="flex-1 rounded-xl border border-line-subtle bg-surface px-3 py-2 text-body-sm"
                            />
                            <button
                              type="button"
                              onClick={createQuickCommunity}
                              disabled={setupLoading}
                              className="btn-primary px-4 py-2 text-sm"
                            >
                              Create
                            </button>
                          </div>
                        </div>
                      )}
                      {communities.length > 0 && communityId && groups.length === 0 && (
                        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 space-y-3 mb-4">
                          <p className="text-body-sm font-semibold text-primary">Create a group in this community.</p>
                          <div className="flex gap-2">
                            <input
                              value={quickGroupName}
                              onChange={(e) => setQuickGroupName(e.target.value)}
                              placeholder="Group name"
                              className="flex-1 rounded-xl border border-line-subtle bg-surface px-3 py-2 text-body-sm"
                            />
                            <button
                              type="button"
                              onClick={createQuickGroup}
                              disabled={setupLoading}
                              className="btn-primary px-4 py-2 text-sm"
                            >
                              Create group
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-label-md font-semibold text-foreground">Community *</label>
                          <select
                            required
                            value={communityId}
                            onChange={(e) => {
                              console.log("[CreateMeetingDialog] Community selected:", e.target.value);
                              setCommunityId(e.target.value);
                              setGroupId("");
                            }}
                            className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:outline-none"
                          >
                            <option value="">Select Community</option>
                            {communities?.map((c: any) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-label-md font-semibold text-foreground">Group *</label>
                          <select
                            required
                            value={groupId}
                            onChange={(e) => {
                              console.log("[CreateMeetingDialog] Group selected:", e.target.value);
                              setGroupId(e.target.value);
                            }}
                            disabled={!communityId}
                            className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:outline-none disabled:opacity-50"
                          >
                            <option value="">Select Group</option>
                            {groups?.map((g: any) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {groupMembers && groupMembers.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-label-md font-semibold text-foreground">
                            Group members
                            <span className="ml-2 text-label-sm text-secondary font-normal">
                              ({groupMembers.length} will be auto-invited)
                            </span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {groupMembers.map((m: any) => (
                              <span
                                key={m.user_id}
                                className="inline-flex items-center gap-1.5 rounded-pill bg-lime/10 px-3 py-1 text-label-sm text-lime"
                              >
                                <span className="material-symbols-outlined text-[14px]">person</span>
                                {m.full_name || m.email}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-label-md font-semibold text-foreground">Additional Attendees</label>
                        <p className="text-label-sm text-muted">
                          Extra emails beyond group members (comma-separated)
                        </p>
                        <textarea
                          rows={3}
                          value={extraEmails}
                          onChange={(e) => setExtraEmails(e.target.value)}
                          className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:outline-none resize-none"
                          placeholder="john@example.com, jane@example.com"
                        />
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-line-subtle/30 flex items-center justify-between">
              <div className="flex gap-2">
                {step !== "details" && (
                  <button
                    onClick={() => {
                      const prevStep = step === "people" ? "agenda" : "details";
                      console.log(`[CreateMeetingDialog] Back clicked, moving to: ${prevStep}`);
                      setStep(prevStep);
                    }}
                    className="btn-secondary py-3 px-6 text-label-md font-bold"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    console.log("[CreateMeetingDialog] Cancel clicked");
                    onClose();
                  }}
                  className="py-3 px-4 text-label-md text-muted hover:text-primary transition"
                >
                  Cancel
                </button>
              </div>

              <div className="flex gap-3">
                {step !== "people" && (
                  <button
                    onClick={() => {
                      const nextStep = step === "details" ? "agenda" : "people";
                      console.log(`[CreateMeetingDialog] Next clicked, moving to: ${nextStep}`);
                      setStep(nextStep);
                    }}
                    disabled={step === "details" && (!title || !date || !location)}
                    className="btn-primary py-3 px-6 text-label-md font-bold disabled:opacity-40"
                  >
                    Next
                    <span className="material-symbols-outlined text-[18px] ml-1">arrow_forward</span>
                  </button>
                )}
                {step === "people" && (
                  <button
                    onClick={() => {
                      console.log("[CreateMeetingDialog] Create Meeting clicked");
                      handleSubmit();
                    }}
                    disabled={loading || !groupId}
                    className="btn-primary py-3 px-8 text-label-md font-bold disabled:opacity-40"
                  >
                    {loading ? "Creating…" : "Create Meeting"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
