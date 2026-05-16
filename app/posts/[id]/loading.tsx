import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return (
    <AppShell>
      <div className="skeleton skeleton-text" style={{ width: "200px", height: "32px", marginBottom: "8px" }} />
      <div className="skeleton skeleton-text" style={{ width: "260px", height: "14px", marginBottom: "2rem" }} />
      <div style={{ display: "flex", gap: "1.5rem", flexDirection: "column", maxWidth: "600px" }}>
        <div className="card">
          <div className="card-header"><div className="skeleton skeleton-text" style={{ width: "60px", margin: 0 }} /></div>
          <div className="card-body">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div className="skeleton" style={{ width: "80px", height: "24px", borderRadius: "9999px" }} />
              <div className="skeleton skeleton-text" style={{ width: "70px" }} />
              <div className="skeleton skeleton-text" style={{ width: "120px" }} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="skeleton skeleton-text" style={{ width: "70px", margin: 0 }} /></div>
          <div className="card-body">
            <div className="skeleton skeleton-text long" />
            <div className="skeleton skeleton-text" style={{ width: "85%", marginTop: "6px" }} />
            <div className="skeleton skeleton-text short" style={{ marginTop: "6px" }} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="skeleton skeleton-text" style={{ width: "90px", margin: 0 }} /></div>
          <div className="card-body">
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div className="skeleton" style={{ flex: "1 1 180px", height: "56px", borderRadius: "var(--radius-buttons)" }} />
              <div className="skeleton" style={{ flex: "1 1 140px", height: "56px", borderRadius: "var(--radius-buttons)" }} />
            </div>
            <div className="skeleton" style={{ width: "150px", height: "36px", borderRadius: "var(--radius-buttons)", marginTop: "1rem" }} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
