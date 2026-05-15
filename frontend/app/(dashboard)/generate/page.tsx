"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";

export default function GeneratorPage() {
  const [mode, setMode] = useState<"audio" | "points">("audio");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [points, setPoints] = useState<string>("");
  const [meetingInfo, setMeetingInfo] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      if (mode === "audio") {
        if (!audioFile) return;
        const formData = new FormData();
        formData.append("audio", audioFile);
        formData.append("meetingInfo", meetingInfo);

        const res = await fetch(apiUrl("/generate-from-audio"), {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        setResult(data);
      } else {
        const res = await fetch(apiUrl("/generate-from-points"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            points: points.split("\n").filter((p) => p.trim()),
            meetingInfo,
          }),
        });
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="font-display text-display-xl text-primary">MOM Generator</h1>
        <p className="mt-2 text-body-lg text-muted">AI-powered transcription and minutes generation.</p>
      </div>

      <div className="flex justify-center gap-2 rounded-pill bg-surface-container-high p-1 max-w-xs mx-auto">
        <button
          onClick={() => setMode("audio")}
          className={`flex-1 rounded-pill px-6 py-2 text-label-md transition ${
            mode === "audio" ? "bg-white text-primary shadow-sm" : "text-muted hover:text-primary"
          }`}
        >
          Audio upload
        </button>
        <button
          onClick={() => setMode("points")}
          className={`flex-1 rounded-pill px-6 py-2 text-label-md transition ${
            mode === "points" ? "bg-white text-primary shadow-sm" : "text-muted hover:text-primary"
          }`}
        >
          Discussion points
        </button>
      </div>

      <div className="glass-card rounded-3xl p-8 space-y-6 shadow-xl">
        <div className="space-y-2">
          <label className="text-label-md font-semibold text-primary">Meeting context (Optional)</label>
          <input
            type="text"
            value={meetingInfo}
            onChange={(e) => setMeetingInfo(e.target.value)}
            className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition"
            placeholder="e.g., Weekly Sync, Core Team, 2024-05-14"
          />
        </div>

        {mode === "audio" ? (
          <div className="space-y-4">
            <div
              className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 transition ${
                audioFile ? "border-lime bg-lime/5" : "border-line-subtle bg-surface-container-low"
              }`}
            >
              <input
                type="file"
                id="audio-upload"
                className="hidden"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="audio-upload" className="flex flex-col items-center cursor-pointer">
                <span className="material-symbols-outlined text-[48px] text-secondary mb-4">
                  {audioFile ? "check_circle" : "cloud_upload"}
                </span>
                <p className="text-body-md font-semibold text-primary">
                  {audioFile ? audioFile.name : "Click to upload audio recording"}
                </p>
                <p className="text-body-sm text-muted mt-1">MP3, WAV, or M4A supported</p>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-label-md font-semibold text-primary">Discussion points (One per line)</label>
            <textarea
              rows={6}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full rounded-2xl border-line-subtle bg-surface-container-low px-4 py-3 text-body-md focus:border-lime focus:ring-lime transition"
              placeholder="Enter key points discussed during the meeting..."
            />
          </div>
        )}

        <button
          onClick={() => {
            if (mode === "audio" && !audioFile) {
              alert("Please select an audio file first.");
              return;
            }
            if (mode === "points" && !points) {
              alert("Please enter some discussion points.");
              return;
            }
            handleGenerate();
          }}
          disabled={loading}
          className={`w-full py-4 text-body-md font-bold shadow-lg shadow-lime/20 flex items-center justify-center gap-2 ${loading ? "bg-on-surface-variant text-white cursor-not-allowed" : "btn-primary"}`}
        >
          {loading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Processing with AI...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">magic_button</span>
              Generate Minutes
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-3xl p-8 shadow-xl">
              <h2 className="font-display text-headline-md text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">description</span>
                Generated MOM
              </h2>
              <div className="prose prose-invert max-w-none text-body-md text-on-surface whitespace-pre-wrap leading-relaxed">
                {result.mom}
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.mom);
                    alert("Copied to clipboard!");
                  }}
                  className="btn-secondary flex-1 py-3 text-label-md font-bold"
                >
                  Copy to clipboard
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([result.mom], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "Minutes_Of_Meeting.txt";
                    a.click();
                  }}
                  className="btn-primary flex-1 py-3 text-label-md font-bold"
                >
                  Download TXT
                </button>
              </div>
            </div>

            {result.transcript && (
              <div className="glass-card rounded-3xl p-8 shadow-xl">
                <h2 className="font-display text-headline-sm text-primary mb-4">Original Transcript</h2>
                <p className="text-body-sm text-muted leading-relaxed italic">
                  {result.transcript}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
