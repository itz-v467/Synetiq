import { SemanticSearch } from "@/components/search/SemanticSearch";

export default function InsightsPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-12">
      <div className="text-center">
        <h1 className="font-display text-display-xl text-primary">Institutional Memory</h1>
        <p className="mt-2 text-body-lg text-muted">Query your community's collective knowledge using natural language.</p>
      </div>

      <SemanticSearch />
    </section>
  );
}
