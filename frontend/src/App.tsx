export default function App() {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <p className="eyebrow">Kenz POS</p>
        <h1>One clean landing page. No dashboard. No backend API.</h1>
        <p className="subtitle">
          This frontend has been reduced to a static landing experience only.
        </p>
      </section>

      <section className="landing-grid" aria-label="Highlights">
        <article className="card">
          <h2>Fast Setup</h2>
          <p>Single-page frontend with no API dependencies.</p>
        </article>
        <article className="card">
          <h2>Offline Friendly</h2>
          <p>Static content that renders instantly in any environment.</p>
        </article>
        <article className="card">
          <h2>Clean Scope</h2>
          <p>Dashboard, auth flows, and backend integrations removed entirely.</p>
        </article>
      </section>
    </main>
  );
}
