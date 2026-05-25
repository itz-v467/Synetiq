"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── helpers ─────────────────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    LIVE: "bg-lime/20 text-lime",
    PUBLISHED: "bg-blue-400/20 text-blue-400",
    ENDED: "bg-amber-400/20 text-amber-400",
    DRAFT: "bg-surface-container-highest text-muted",
    ARCHIVED: "bg-surface-container-highest text-muted",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-label-caps font-bold tracking-widest ${colors[status] || "bg-surface-container-highest text-muted"}`}>
      {status}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;
  const queryClient = useQueryClient();

  const searchParams = useSearchParams();
  const validTabs = ["overview", "agenda", "people", "intelligence", "outcomes", "history"] as const;
  type TabId = (typeof validTabs)[number];
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTabState] = useState<TabId>(
    validTabs.includes(tabFromUrl as TabId) ? (tabFromUrl as TabId) : "overview"
  );

  const setActiveTab = (tab: TabId) => {
    setActiveTabState(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl as TabId)) {
      setActiveTabState(tabFromUrl as TabId);
    }
  }, [tabFromUrl]);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["meeting-dashboard", meetingId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}/dashboard`));
      return res.ok ? res.json() : null;
    },
  });

  const { data: historyRows = [] } = useQuery({
    queryKey: ["meeting-history", meetingId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}/history`));
      return res.ok ? res.json() : [];
    },
  });

  // ── meeting ──
  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}`));
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  // ── agenda ──
  const { data: agenda = [] } = useQuery({
    queryKey: ["agenda", meetingId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/agenda/${meetingId}`));
      return res.ok ? res.json() : [];
    },
  });

  // ── invitations ──
  const { data: invitations = [] } = useQuery({
    queryKey: ["invitations", meetingId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}/invitations`));
      return res.ok ? res.json() : [];
    },
  });

  // ── minutes ──
  const { data: minutesList = [] } = useQuery({
    queryKey: ["minutes", meetingId],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}/minutes`));
      return res.ok ? res.json() : [];
    },
  });

  // ─────────────────────────────────────────────
  //  DETAILS
  // ─────────────────────────────────────────────
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editDate, setEditDate] = useState("");

  const initEdit = (m: any) => {
    setEditTitle(m.title ?? "");
    setEditLocation(m.location ?? "");
    setEditDesc(m.description ?? "");
    setEditStart(m.start_time ?? "");
    setEditEnd(m.end_time ?? "");
    setEditDate(m.meeting_date ?? "");
  };

  const saveDetailsMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] }),
  });

  // ─────────────────────────────────────────────
  //  AGENDA
  // ─────────────────────────────────────────────
  const [newTopic, setNewTopic] = useState("");
  const [newPresenter, setNewPresenter] = useState("");
  const [newDuration, setNewDuration] = useState(15);

  const addAgendaMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/agenda"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_id: Number(meetingId),
          topic: newTopic,
          presenter: newPresenter || null,
          duration_minutes: newDuration,
          position: agenda.length,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] });
      setNewTopic(""); setNewPresenter(""); setNewDuration(15);
    },
  });

  const deleteAgendaMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/agenda/item/${itemId}`), { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda", meetingId] }),
  });

  // ─────────────────────────────────────────────
  //  ATTENDEES
  // ─────────────────────────────────────────────
  const [inviteEmails, setInviteEmails] = useState("");

  const inviteMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}/invite`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: Number(meetingId), emails }),
      });
      if (!res.ok) throw new Error("Failed to invite");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", meetingId] });
      setInviteEmails("");
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: async ({ email, status }: { email: string; status: string }) => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}/attendance`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed");
      }
    },
    onError: (e: any) => alert(e.message),
  });

  // ─────────────────────────────────────────────
  //  MINUTES
  // ─────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);

  const transitionMutation = useMutation({
    mutationFn: async (to_status: string) => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}/transition`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_status }),
      });
      if (!res.ok) throw new Error("Transition failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["meeting-dashboard", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meeting-history", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const [notesForMom, setNotesForMom] = useState("");
  const [viewMinutesId, setViewMinutesId] = useState<number | null>(null);

  const { data: viewingMinutes, isLoading: viewingMinutesLoading } = useQuery({
    queryKey: ["minute-details", meetingId, viewMinutesId],
    queryFn: async () => {
      if (!viewMinutesId) return null;
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}/minutes/${viewMinutesId}`));
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!viewMinutesId,
  });
  const generateMomMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}/mom/generate`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript_or_notes: notesForMom, meeting_info: meeting?.title || "" }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.detail || "Generate failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minutes", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meeting-dashboard", meetingId] });
      setNotesForMom("");
    },
  });

  // ─────────────────────────────────────────────
  //  VOICE RECORDER
  // ─────────────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "recording" | "uploading" | "success">("idle");

  const startRecording = async () => {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        await uploadAudio(blob, mimeType);
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      setVoiceStatus("recording");
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (err: any) {
      setVoiceError(err?.message || "Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setVoiceStatus("uploading");
  };

  const uploadAudio = async (blob: Blob, mimeType: string) => {
    try {
      const ext = mimeType.includes("webm") ? "webm" : "ogg";
      const form = new FormData();
      form.append("audio", blob, `recording.${ext}`);
      form.append("source", "audio");
      form.append("meeting_info", meeting?.title || "");
      const res = await fetchWithAuth(
        apiUrl(`/api/v1/meetings/${meetingId}/intelligence/generate`),
        { method: "POST", body: form }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.detail || `Server error ${res.status}`);
      }
      setVoiceStatus("success");
      queryClient.invalidateQueries({ queryKey: ["minutes", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meeting-dashboard", meetingId] });
      setTimeout(() => setVoiceStatus("idle"), 4000);
    } catch (err: any) {
      setVoiceError(err?.message || "Upload failed");
      setVoiceStatus("idle");
    }
  };

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const publishMomMutation = useMutation({
    mutationFn: async (momId: number) => {
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}/mom/${momId}/publish`), { method: "POST" });
      if (!res.ok) throw new Error("Publish failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minutes", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meeting-dashboard", meetingId] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetchWithAuth(apiUrl(`/api/v1/meetings/${meetingId}/minutes/upload`), {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["minutes", meetingId] }),
    onError: (e: any) => alert(e.message),
  });

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex h-96 items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
  if (!meeting) return <div className="p-8 text-center text-error">Meeting not found</div>;

  // initialise edit fields lazily
  if (!editTitle && meeting) initEdit(meeting);

  return (
    <section className="space-y-6 max-w-5xl">
      {/* ── Breadcrumb / header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button onClick={() => router.push("/meetings")} className="flex items-center gap-1 text-label-md text-muted hover:text-primary transition mb-2">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Meetings
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-display-md text-primary">{meeting.title}</h1>
            <StatusBadge status={meeting.status} />
          </div>
          <p className="mt-1 text-body-md text-muted">
            {meeting.meeting_date} &bull; {meeting.start_time}{meeting.end_time ? ` – ${meeting.end_time}` : ""} &bull; {meeting.location}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {meeting.status === "DRAFT" && (
            <button onClick={() => transitionMutation.mutate("PUBLISHED")} className="btn-primary text-sm">Publish</button>
          )}
          {meeting.status === "PUBLISHED" && (
            <button onClick={() => transitionMutation.mutate("LIVE")} className="btn-primary text-sm">Start meeting</button>
          )}
          {meeting.status === "LIVE" && (
            <>
              <button onClick={() => transitionMutation.mutate("ENDED")} className="btn-primary text-sm">End meeting</button>
              <button onClick={() => router.push(`/live?meetingId=${meetingId}`)} className="rounded-pill border border-lime px-4 py-2 text-sm text-lime">Live capture</button>
            </>
          )}
          {meeting.status === "ENDED" && (
            <button onClick={() => transitionMutation.mutate("ARCHIVED")} className="rounded-pill border border-line-subtle px-4 py-2 text-sm">Archive</button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 border-b border-line-subtle overflow-x-auto">
        <TabBtn label="Overview" icon="dashboard" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
        <TabBtn label="Agenda" icon="list" active={activeTab === "agenda"} onClick={() => setActiveTab("agenda")} />
        <TabBtn label="People" icon="group" active={activeTab === "people"} onClick={() => setActiveTab("people")} />
        <TabBtn label="Intelligence" icon="psychology" active={activeTab === "intelligence"} onClick={() => setActiveTab("intelligence")} />
        <TabBtn label="Outcomes" icon="task_alt" active={activeTab === "outcomes"} onClick={() => setActiveTab("outcomes")} />
        <TabBtn label="History" icon="history" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >

          {/* ════════════ DETAILS ════════════ */}
          {activeTab === "overview" && (
            <div className="glass-card p-6 rounded-3xl space-y-5 max-w-2xl">
              <h2 className="text-headline-sm font-display text-primary">Edit Details</h2>
              <div className="space-y-1">
                <label className="text-label-md font-semibold text-foreground">Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-2.5 text-body-md focus:border-lime focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-label-md font-semibold text-foreground">Description</label>
                <textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-2.5 text-body-md focus:border-lime focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-1">
                  <label className="text-label-md font-semibold text-foreground">Date</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-2.5 text-body-md focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md font-semibold text-foreground">Start</label>
                  <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)}
                    className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-2.5 text-body-md focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md font-semibold text-foreground">End</label>
                  <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)}
                    className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-2.5 text-body-md focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-label-md font-semibold text-foreground">Location</label>
                <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-2.5 text-body-md focus:border-lime focus:outline-none" />
              </div>
              <button
                disabled={saveDetailsMutation.isPending}
                onClick={() => saveDetailsMutation.mutate({ title: editTitle, description: editDesc, meeting_date: editDate, start_time: editStart, end_time: editEnd, location: editLocation })}
                className="btn-primary py-2.5 px-8 text-label-md font-bold"
              >
                {saveDetailsMutation.isPending ? "Saving…" : saveDetailsMutation.isSuccess ? "✓ Saved" : "Save Changes"}
              </button>
            </div>
          )}

          {/* ════════════ AGENDA ════════════ */}
          {activeTab === "agenda" && (
            <div className="space-y-4">
              {agenda.length === 0 && (
                <p className="text-muted text-body-md py-4">No agenda items yet. Add one below.</p>
              )}
              {agenda.map((item: any, idx: number) => (
                <div key={item.id} className="glass-card rounded-2xl p-4 flex items-start gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-lime/15 text-lime text-label-md font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{item.topic}</p>
                    {item.presenter && <p className="text-label-sm text-muted mt-0.5">Presenter: {item.presenter}</p>}
                  </div>
                  <span className="text-label-sm text-secondary font-bold whitespace-nowrap">{item.duration_minutes} min</span>
                  <button onClick={() => deleteAgendaMutation.mutate(item.id)} className="text-muted hover:text-error transition">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}

              {/* Add new item */}
              <div className="glass-card rounded-2xl p-4 space-y-3">
                <p className="text-label-md font-semibold text-primary">Add Item</p>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <input value={newTopic} onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Topic *"
                      className="w-full rounded-xl border border-line-subtle bg-surface-container-low px-3 py-2 text-body-sm focus:border-lime focus:outline-none" />
                  </div>
                  <div className="col-span-4">
                    <input value={newPresenter} onChange={(e) => setNewPresenter(e.target.value)}
                      placeholder="Presenter"
                      className="w-full rounded-xl border border-line-subtle bg-surface-container-low px-3 py-2 text-body-sm focus:border-lime focus:outline-none" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min={1} value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full rounded-xl border border-line-subtle bg-surface-container-low px-3 py-2 text-body-sm focus:border-lime focus:outline-none" />
                  </div>
                  <div className="col-span-1">
                    <button
                      disabled={!newTopic.trim() || addAgendaMutation.isPending}
                      onClick={() => addAgendaMutation.mutate()}
                      className="w-full h-full flex items-center justify-center rounded-xl bg-lime text-primary hover:opacity-90 transition disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ ATTENDEES ════════════ */}
          {activeTab === "people" && (
            <div className="space-y-6">
              {/* invite */}
              <div className="glass-card p-6 rounded-3xl space-y-3">
                <h2 className="text-headline-sm font-display text-primary">Invite Additional Attendees</h2>
                <div className="flex gap-3 max-w-2xl">
                  <input
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                    className="flex-1 rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-2.5 text-body-md focus:border-lime focus:outline-none"
                  />
                  <button
                    disabled={inviteMutation.isPending || !inviteEmails.trim()}
                    onClick={() => inviteMutation.mutate(inviteEmails.split(",").map((e) => e.trim()).filter(Boolean))}
                    className="btn-primary px-6 py-2.5 text-label-md font-bold disabled:opacity-40"
                  >
                    {inviteMutation.isPending ? "Sending…" : "Send Invites"}
                  </button>
                </div>
              </div>

              {/* invitees table */}
              <div className="glass-card p-6 rounded-3xl space-y-3">
                <h2 className="text-headline-sm font-display text-primary">
                  Attendees
                  <span className="ml-2 text-label-md text-muted font-normal">({invitations.length})</span>
                </h2>
                {invitations.length === 0 ? (
                  <p className="text-muted text-body-md">No attendees yet.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {invitations.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-muted">person</span>
                          <span className="font-medium text-body-md">{inv.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${
                            inv.rsvp_status === "ACCEPTED" ? "bg-green-500/15 text-green-500" :
                            inv.rsvp_status === "DECLINED" ? "bg-red-500/15 text-red-500" :
                            "bg-amber-500/15 text-amber-500"
                          }`}>{inv.rsvp_status}</span>
                          <button
                            onClick={() => attendanceMutation.mutate({ email: inv.email, status: "PRESENT" })}
                            className="rounded-pill bg-lime/10 px-3 py-1 text-label-sm text-lime hover:bg-lime hover:text-primary transition"
                          >Present</button>
                          <button
                            onClick={() => attendanceMutation.mutate({ email: inv.email, status: "ABSENT" })}
                            className="rounded-pill bg-red-500/10 px-3 py-1 text-label-sm text-red-400 hover:bg-red-500 hover:text-white transition"
                          >Absent</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════ INTELLIGENCE ════════════ */}
          {activeTab === "intelligence" && (
            <div className="space-y-6">
              {/* Text notes → MOM */}
              <div className="glass-card p-6 rounded-3xl space-y-4">
                <h2 className="text-headline-sm font-display text-primary">Meeting Intelligence</h2>
                <textarea
                  rows={4}
                  value={notesForMom}
                  onChange={(e) => setNotesForMom(e.target.value)}
                  placeholder="Paste transcript or notes…"
                  className="w-full rounded-2xl border border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:outline-none resize-none"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => generateMomMutation.mutate()}
                    disabled={!notesForMom.trim() || generateMomMutation.isPending}
                    className="btn-primary py-3 px-6 flex items-center gap-2 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                    {generateMomMutation.isPending ? "Generating…" : "Generate MOM"}
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="btn-secondary py-3 px-6 flex items-center gap-2 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[20px]">upload</span>
                    {uploadMutation.isPending ? "Uploading…" : "Upload Minutes (.txt)"}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadMutation.mutate(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                {uploadMutation.isSuccess && (
                  <p className="text-label-sm text-lime">✓ Minutes uploaded successfully.</p>
                )}
                {generateMomMutation.isError && (
                  <p className="text-label-sm text-red-400">✗ {(generateMomMutation.error as Error)?.message}</p>
                )}
              </div>

              {/* ── Voice Recorder ── */}
              <div className="glass-card p-6 rounded-3xl space-y-5 overflow-hidden relative">
                {/* ambient glow while recording */}
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 60%, hsl(142 71% 45% / 0.13) 0%, transparent 70%)",
                    }}
                  />
                )}

                <div className="flex items-center justify-between relative">
                  <div>
                    <h2 className="text-headline-sm font-display text-primary">Voice Recorder</h2>
                    <p className="text-label-sm text-muted mt-0.5">
                      Record audio — AI transcribes it and generates minutes automatically
                    </p>
                  </div>
                  {voiceStatus === "success" && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lime/15 text-lime text-label-sm font-bold"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      MOM Generated!
                    </motion.span>
                  )}
                </div>

                {/* Animated waveform */}
                <div className="flex items-end justify-center gap-1 h-12">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 rounded-full"
                      style={{
                        backgroundColor: isRecording
                          ? "hsl(142 71% 45%)"
                          : "hsl(220 13% 30%)",
                      }}
                      animate={
                        isRecording
                          ? {
                              height: [
                                `${10 + Math.abs(Math.sin(i * 0.7)) * 8}px`,
                                `${28 + Math.abs(Math.sin(i * 1.4 + 1)) * 18}px`,
                                `${10 + Math.abs(Math.sin(i * 0.7)) * 8}px`,
                              ],
                            }
                          : { height: "6px" }
                      }
                      transition={
                        isRecording
                          ? {
                              duration: 0.65 + i * 0.025,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: i * 0.035,
                            }
                          : { duration: 0.3 }
                      }
                    />
                  ))}
                </div>

                {/* Timer */}
                <AnimatePresence>
                  {(isRecording || voiceStatus === "uploading") && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center justify-center gap-2"
                    >
                      {isRecording && (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                      <span className="font-mono text-3xl font-bold text-primary tabular-nums tracking-widest">
                        {voiceStatus === "uploading" ? "Processing…" : fmtTime(recordSeconds)}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mic button */}
                <div className="flex flex-col items-center gap-3">
                  {voiceStatus === "uploading" ? (
                    <div className="flex items-center gap-3 text-muted py-4">
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-label-md">Transcribing &amp; generating MOM…</span>
                    </div>
                  ) : (
                    <motion.button
                      id="voice-record-btn"
                      whileTap={{ scale: 0.92 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`relative flex items-center justify-center h-20 w-20 rounded-full shadow-xl transition-colors ${
                        isRecording ? "bg-red-500 hover:bg-red-600" : "bg-lime hover:opacity-90"
                      }`}
                    >
                      {isRecording && (
                        <motion.span
                          className="absolute inset-0 rounded-full bg-red-400"
                          animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                          transition={{ duration: 1.1, repeat: Infinity }}
                        />
                      )}
                      <span className="material-symbols-outlined text-[32px] text-white z-10 select-none">
                        {isRecording ? "stop" : "mic"}
                      </span>
                    </motion.button>
                  )}

                  <p className="text-label-sm text-muted text-center max-w-xs">
                    {isRecording
                      ? "Recording… click Stop when finished"
                      : voiceStatus === "uploading"
                      ? "Please wait while AI processes your audio…"
                      : voiceStatus === "success"
                      ? "✓ Minutes saved — see Saved Minutes below"
                      : "Click the microphone to start recording your meeting"}
                  </p>
                </div>

                {/* Error */}
                {voiceError && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3"
                  >
                    <span className="material-symbols-outlined text-[18px] text-red-400 mt-0.5">error</span>
                    <div className="flex-1">
                      <p className="text-label-md font-semibold text-red-400">Error</p>
                      <p className="text-label-sm text-red-300 mt-0.5">{voiceError}</p>
                    </div>
                    <button onClick={() => setVoiceError(null)} className="text-red-400 hover:text-red-200 transition">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Saved Minutes list */}
              {minutesList.length > 0 && (
                <div className="glass-card p-6 rounded-3xl space-y-3">
                  <h2 className="text-headline-sm font-display text-primary">Saved Minutes</h2>
                  <div className="space-y-2">
                    {minutesList.map((rec: any) => (
                      <div key={rec.id} className="flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-secondary">description</span>
                          <div>
                            <p className="font-medium text-body-md">{rec.filename || "AI Generated Minutes"}</p>
                            <p className="text-label-sm text-muted">
                              {rec.source === "upload" ? "Uploaded" : "AI Generated"} • {rec.created_at?.slice(0, 10)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${
                            rec.is_published ? "bg-lime/15 text-lime" : "bg-surface-container-highest text-muted"
                          }`}>
                            {rec.is_published ? "Published" : "Draft"}
                          </span>
                          <button
                            onClick={() => setViewMinutesId(rec.id)}
                            className="text-label-sm text-secondary font-bold hover:underline"
                          >
                            View
                          </button>
                          {!rec.is_published && (
                            <button
                              onClick={() => publishMomMutation.mutate(rec.id)}
                              className="text-label-sm text-lime font-bold hover:underline"
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Minutes Modal */}
              {viewMinutesId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-surface-container max-w-3xl w-full max-h-[80vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border border-line-subtle relative">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-headline-md font-display text-primary">Minutes of Meeting</h2>
                      <button onClick={() => setViewMinutesId(null)} className="text-muted hover:text-white transition">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    {viewingMinutesLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    ) : (
                      <div className="prose prose-invert max-w-none text-body-md whitespace-pre-wrap text-on-surface leading-relaxed">
                        {viewingMinutes?.generated_text || "No content available."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "outcomes" && (
            <div className="glass-card p-6 rounded-3xl space-y-4">
              {dashboardLoading && <p className="text-muted">Loading outcomes…</p>}
              {!dashboardLoading && (
                <>
                  <h2 className="text-headline-sm font-display text-primary">Action items</h2>
                  {(dashboard?.action_items || []).length === 0 ? (
                    <p className="text-muted text-body-md">No action items yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(dashboard?.action_items || []).map((a: { id: number; title: string; status: string }) => (
                        <li key={a.id} className="rounded-xl bg-surface-container-low px-4 py-3 flex justify-between">
                          <span>{a.title}</span>
                          <span className="text-muted text-label-sm">{a.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <h2 className="text-headline-sm font-display text-primary pt-4">Decisions</h2>
                  {(dashboard?.decisions || []).length === 0 ? (
                    <p className="text-muted text-body-md">No decisions recorded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(dashboard?.decisions || []).map((d: { id: number; decision_text: string }) => (
                        <li key={d.id} className="rounded-xl bg-surface-container-low px-4 py-3">{d.decision_text}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="glass-card p-6 rounded-3xl space-y-3">
              {(historyRows.length ? historyRows : dashboard?.history || []).length === 0 ? (
                <p className="text-muted text-body-md">No status changes yet.</p>
              ) : (
                (historyRows.length ? historyRows : dashboard?.history || []).map(
                  (h: { from_status: string; to_status: string; created_at: string }, i: number) => (
                    <div key={i} className="flex justify-between rounded-xl bg-surface-container-low px-4 py-3 text-body-sm">
                      <span>{h.from_status} → {h.to_status}</span>
                      <span className="text-muted">{h.created_at}</span>
                    </div>
                  )
                )
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </section>
  );
}
