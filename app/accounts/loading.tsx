import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return (
    <AppShell>
      {/* Header Skeleton */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Accounts</h1>
          <div className="skeleton skeleton-text short" style={{ marginTop: "0.25rem" }} />
        </div>
        <div className="skeleton" style={{ width: "80px", height: "38px", borderRadius: "var(--radius-buttons)" }} />
      </div>

      {/* Search + Filters Skeleton */}
      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0", flexWrap: "wrap", alignItems: "center" }}>
        <div className="skeleton" style={{ flex: "1 1 220px", minWidth: "160px", height: "34px", borderRadius: "var(--radius-buttons)" }} />
        <div className="skeleton" style={{ width: "300px", height: "34px", borderRadius: "var(--radius-buttons)" }} />
      </div>

      {/* Account Grid Skeleton */}
      <div className="accounts-grid-skeleton">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="skeleton skeleton-circle" style={{ width: "44px" }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text medium" />
                <div className="skeleton skeleton-text short" style={{ marginTop: "6px" }} />
              </div>
            </div>
            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-default)", display: "flex", gap: "1rem" }}>
              <div className="skeleton" style={{ height: "24px", width: "60px" }} />
              <div className="skeleton" style={{ height: "24px", width: "80px" }} />
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "1px", background: "var(--border-default)", height: "34px" }}>
               <div className="skeleton" style={{ height: "100%", flex: 1 }} />
               <div className="skeleton" style={{ height: "100%", flex: 1 }} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .accounts-grid-skeleton {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1rem;
        }
        @media (max-width: 786px) {
          .accounts-grid-skeleton {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppShell>
  );
}
