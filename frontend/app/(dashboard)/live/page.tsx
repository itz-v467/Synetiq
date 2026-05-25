"use client";

import { Suspense } from "react";
import LivePageContent from "./LivePageContent";

export default function LivePage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading live capture…</div>}>
      <LivePageContent />
    </Suspense>
  );
}
