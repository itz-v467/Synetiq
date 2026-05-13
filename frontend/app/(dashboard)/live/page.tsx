export default function LivePage() {
  return (
    <section>
      <h1 className="font-display text-display-xl text-primary">Live capture</h1>
      <p className="mt-2 text-body-lg text-muted">
        WebSocket channel: <code className="font-mono text-body-sm">/ws/meetings/&lt;meetingId&gt;</code> — connect from the client when a meeting is live.
      </p>
    </section>
  );
}
