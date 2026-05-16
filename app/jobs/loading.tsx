import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Jobs</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: "0.25rem 0 1rem" }}>
        Monitor post publishing jobs, retries, and execution status.
      </p>

      {/* KPI Row Skeleton */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "0.75rem", margin: "1rem 0",
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <div className="skeleton skeleton-text" style={{ width: "50px" }} />
            <div className="skeleton" style={{ height: "24px", width: "30px", marginTop: "8px" }} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div className="skeleton" style={{ width: "140px", height: "34px", borderRadius: "var(--radius-buttons)" }} />
      </div>

      <div className="card">
        <div style={{ padding: "1.25rem" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="skeleton skeleton-row" style={{ height: "40px", marginBottom: i < 8 ? "0.5rem" : 0 }} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
