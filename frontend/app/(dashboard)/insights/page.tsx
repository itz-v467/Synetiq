"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SemanticSearch } from "@/components/search/SemanticSearch";

function InsightsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  return (
    <section className="mx-auto max-w-5xl space-y-12">
      <div className="text-center">
        <h1 className="font-display text-display-xl text-primary">Institutional Memory</h1>
        <p className="mt-2 text-body-lg text-muted">Query your community's collective knowledge using natural language.</p>
      </div>

      <SemanticSearch initialQuery={initialQuery} />
    </section>
  );
}

export default function InsightsPage() {
  return (
    <Suspense fallback={<div className="text-center text-muted py-12">Loading...</div>}>
      <InsightsContent />
    </Suspense>
  );
}
