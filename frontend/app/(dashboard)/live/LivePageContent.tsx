"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth, getToken } from "@/lib/auth";
import { apiUrl, wsUrl } from "@/lib/api";

export default function LivePageContent() {
  const searchParams = useSearchParams();
  const meetingIdFromUrl = searchParams.get("meetingId") || "";
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(meetingIdFromUrl);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<{ type?: string; text?: string; event?: string; timestamp?: string; data?: unknown }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = true;
        reco.interimResults = true;
        reco.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ event: "transcript", text: finalTranscript.trim() }));
          }
        };
        reco.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
        };
        setRecognition(reco);
      }
    }
  }, []);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const res = await fetchWithAuth(apiUrl("/api/v1/meetings"));
      if (!res.ok) throw new Error("Failed to fetch meetings");
      return res.json();
    },
  });

  const liveMeetings = (meetings || []).filter(
    (m: { status: string }) => m.status === "LIVE" || m.status === "PUBLISHED" || m.status === "DRAFT"
  );

  useEffect(() => {
    if (meetingIdFromUrl) setSelectedMeetingId(meetingIdFromUrl);
  }, [meetingIdFromUrl]);

  useEffect(() => {
    if (!selectedMeetingId) {
      ws?.close();
      setWs(null);
      return;
    }
    const token = getToken();
    const socket = new WebSocket(wsUrl(`/ws/meetings/${selectedMeetingId}?token=${encodeURIComponent(token || "")}`));
    wsRef.current = socket;
    socket.onopen = () => setMessages((prev) => [...prev, { type: "system", text: "Connected." }]);
    socket.onmessage = (event) => {
      try {
        setMessages((prev) => [...prev, JSON.parse(event.data)]);
      } catch {
        setMessages((prev) => [...prev, { type: "system", text: String(event.data) }]);
      }
    };
    socket.onclose = () => {
      setMessages((prev) => [...prev, { type: "system", text: "Disconnected." }]);
      setWs(null);
      wsRef.current = null;
      setIsRecording(false);
      if (recognition) {
        recognition.stop();
      }
    };
    setWs(socket);
    return () => {
      if (recognition) {
        recognition.stop();
      }
      socket.close();
    };
  }, [selectedMeetingId, recognition]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <section className="space-y-8">
      <div>
        <h1 className="font-display text-display-xl text-primary">Live Capture</h1>
        <p className="mt-1 text-body-lg text-muted">Real-time meeting feed (WebSocket).</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-primary">Select meeting</h3>
          {isLoading ? (
            <div className="h-10 animate-pulse bg-surface-container-high rounded-xl" />
          ) : (
            <select
              value={selectedMeetingId}
              onChange={(e) => {
                setSelectedMeetingId(e.target.value);
                setMessages([]);
              }}
              className="w-full rounded-2xl border border-line-subtle px-4 py-3"
            >
              <option value="">-- Choose --</option>
              {liveMeetings.map((m: { id: number; title: string; status: string }) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.status})
                </option>
              ))}
            </select>
          )}
          {selectedMeetingId && (
            <>
              <p className="text-sm text-muted">{ws?.readyState === WebSocket.OPEN ? "Connected" : "Disconnected"}</p>
              <button
                type="button"
                className="btn-primary w-full"
                disabled={ws?.readyState !== WebSocket.OPEN}
                onClick={() => {
                  if (!ws) return;
                  const next = !isRecording;
                  setIsRecording(next);
                  ws.send(JSON.stringify({ event: next ? "capture_started" : "capture_stopped" }));
                  if (recognition) {
                    if (next) {
                      try {
                        recognition.start();
                      } catch (e) {
                        console.error("Failed to start recognition", e);
                      }
                    } else {
                      recognition.stop();
                    }
                  }
                }}
              >
                {isRecording ? "Stop" : "Start"} capture
              </button>
              {!recognition && (
                <p className="text-sm text-error mt-2">Speech recognition is not supported in your browser.</p>
              )}
            </>
          )}
        </div>
        <div className="lg:col-span-2 rounded-3xl bg-[#1e1e1e] p-6 h-[480px] overflow-y-auto font-mono text-sm text-white/90 space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className="rounded-lg bg-white/5 p-2">
              {msg.type === "system" ? msg.text : JSON.stringify(msg)}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </section>
  );
}
