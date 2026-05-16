import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Media</h1>
      <div className="skeleton skeleton-text short" style={{ marginTop: "0.25rem", marginBottom: "1rem" }} />

      {/* Filter Skeleton */}
      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="skeleton" style={{ flex: "1 1 220px", height: "34px", borderRadius: "var(--radius-buttons)" }} />
        <div className="skeleton" style={{ flex: "0 0 160px", height: "34px", borderRadius: "var(--radius-buttons)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="skeleton" style={{ aspectRatio: "16/9", borderRadius: 0 }} />
            <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div className="skeleton skeleton-text long" />
              <div className="skeleton skeleton-text medium" />
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                <div className="skeleton" style={{ height: "20px", width: "60px", borderRadius: "var(--radius-full)" }} />
                <div className="skeleton" style={{ height: "24px", width: "80px", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
