import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Posts</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: "0.25rem 0 1rem" }}>
        Browse, filter, and manage all your scheduled and published content.
      </p>

      {/* Filter Row Skeleton */}
      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="skeleton" style={{ width: "240px", height: "34px", borderRadius: "var(--radius-buttons)" }} />
        <div className="skeleton" style={{ width: "140px", height: "34px", borderRadius: "var(--radius-buttons)" }} />
        <div className="skeleton" style={{ width: "120px", height: "34px", borderRadius: "var(--radius-buttons)" }} />
        <div className="skeleton" style={{ width: "150px", height: "34px", borderRadius: "var(--radius-buttons)" }} />
      </div>

      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ width: "80px", height: "26px", borderRadius: "var(--radius-buttons)" }} />
        ))}
      </div>

      <div className="card">
        <div className="card-header" style={{ justifyContent: "space-between" }}>
          <div className="skeleton skeleton-text" style={{ width: "60px", margin: 0 }} />
          <div className="skeleton skeleton-text" style={{ width: "80px", margin: 0 }} />
        </div>
        <div style={{ padding: "1.25rem" }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton skeleton-row" style={{ height: "80px", marginBottom: i < 5 ? "0.75rem" : 0, borderRadius: "var(--radius-cards)" }} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
