import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return (
    <AppShell>
      <div className="page-header" style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", fontWeight: 600, margin: 0, letterSpacing: "var(--tracking-heading)" }}>Create Post</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", marginTop: "0.25rem" }}>
          Build and schedule your Meta content.
        </p>
      </div>

      <div className="create-layout-skeleton">
        {/* Form Skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-cards)" }}>
              <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border-default)" }}>
                <div className="skeleton" style={{ height: "16px", width: "80px" }} />
              </div>
              <div style={{ padding: "1rem 1.25rem" }}>
                <div className="skeleton" style={{ height: i === 2 ? "100px" : "34px", borderRadius: "var(--radius-buttons)" }} />
              </div>
            </div>
          ))}
          <div className="skeleton" style={{ height: "40px", borderRadius: "var(--radius-buttons)", width: "100%" }} />
        </div>

        {/* Preview Skeleton */}
        <div className="preview-skeleton-column">
           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
             <div className="skeleton" style={{ height: "14px", width: "60px" }} />
             <div className="skeleton" style={{ height: "30px", width: "120px", borderRadius: "var(--radius-buttons)" }} />
           </div>
           <div className="skeleton" style={{ height: "500px", width: "100%", borderRadius: "var(--radius-cards)" }} />
        </div>
      </div>

      <style>{`
        .create-layout-skeleton {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: start;
        }
        @media (min-width: 1200px) {
          .create-layout-skeleton {
            grid-template-columns: 1fr 480px;
          }
        }
        @media (max-width: 1024px) {
          .preview-skeleton-column {
            display: none;
          }
        }
      `}</style>
    </AppShell>
  );
}
