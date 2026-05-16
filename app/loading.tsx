import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Dashboard</h1>
      <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 2rem", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)" }}>
        Monitor queue health and scheduled content at a glance.
      </p>

      {/* KPI Row Skeleton */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card" style={{ flex: "1 1 180px" }}>
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text long" style={{ height: "28px", marginTop: "8px" }} />
            <div className="skeleton skeleton-text short" style={{ marginTop: "auto" }} />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        {/* Left Column Skeleton */}
        <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <div className="card-header"><div className="skeleton skeleton-text" style={{ width: "120px", margin: 0 }} /></div>
            <div className="card-body">
               <div className="skeleton" style={{ height: "200px", width: "100%", borderRadius: "var(--radius-cards)" }} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="skeleton skeleton-text" style={{ width: "100px", margin: 0 }} /></div>
            <div className="card-body" style={{ padding: 0 }}>
               {[1, 2, 3].map(i => (
                 <div key={i} style={{ padding: "1rem", borderBottom: i < 3 ? "1px solid var(--border-default)" : "none" }}>
                   <div className="skeleton skeleton-text long" />
                   <div className="skeleton skeleton-text short" style={{ marginTop: "8px" }} />
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <div className="card-header"><div className="skeleton skeleton-text" style={{ width: "110px", margin: 0 }} /></div>
            <div className="card-body" style={{ padding: 0 }}>
              {[1, 2, 3, 4].map(i => (
                 <div key={i} style={{ padding: "0.75rem 1rem", borderBottom: i < 4 ? "1px solid var(--border-default)" : "none", display: "flex", gap: "10px" }}>
                   <div className="skeleton" style={{ width: "36px", height: "36px", borderRadius: "6px" }} />
                   <div style={{ flex: 1 }}>
                     <div className="skeleton skeleton-text medium" />
                     <div className="skeleton skeleton-text short" style={{ marginTop: "4px" }} />
                   </div>
                 </div>
              ))}
            </div>
          </div>
          <div className="card">
             <div className="card-header"><div className="skeleton skeleton-text" style={{ width: "100px", margin: 0 }} /></div>
             <div className="card-body" style={{ padding: "1.25rem 1.5rem" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: i < 3 ? "0.8rem" : 0 }}>
                    <div className="skeleton skeleton-text" style={{ width: "60px" }} />
                    <div style={{ flex: 1, height: "1px", background: "var(--border-default)", opacity: 0.4 }} />
                    <div className="skeleton" style={{ width: "80px", height: "16px" }} />
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
