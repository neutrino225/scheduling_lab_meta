"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getApiData } from "@/lib/client/api";
import type { Account } from "@/lib/client/types";
import { SegmentedControl } from "@/components/primitives/segmented-control";
import "@/app/components.css";

function fmtCount(n: number | null | undefined) {
  if (n == null) return null;
  return n.toLocaleString();
}

const FbIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const IgIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="5" fill="none" stroke="#fff" strokeWidth="1.5" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="#fff" />
  </svg>
);

const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
  </svg>
);

const FbColor = "var(--text-primary)";
const IgColor = "var(--accent-primary)";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "facebook" | "instagram" | "dual">("all");

  const loadAccounts = useCallback(async (sync = false) => {
    if (sync) setSyncing(true);
    try {
      const data = await getApiData<Account[]>(sync ? "/api/accounts?sync=true" : "/api/accounts");
      setAccounts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const totalFollowers = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.followersCount || 0), 0),
    [accounts]
  );

  const filtered = useMemo(() => {
    let list = accounts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (platformFilter === "facebook") list = list.filter((a) => a.platform === "facebook");
    else if (platformFilter === "instagram") list = list.filter((a) => !!a.igUserId);
    else if (platformFilter === "dual") list = list.filter((a) => !!a.igUserId);
    return list;
  }, [accounts, search, platformFilter]);

  const filters = [
    { label: "All", value: "all" as const },
    { label: "Facebook", value: "facebook" as const },
    { label: "Instagram", value: "instagram" as const },
    { label: "Dual-Platform", value: "dual" as const },
  ];

  return (
    <AppShell>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Accounts</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: "0.25rem 0 0" }}>
            {accounts.length} connected
            {totalFollowers > 0 ? ` · ${fmtCount(totalFollowers)} total followers` : ""}
          </p>
        </div>
        <button
          onClick={() => loadAccounts(true)}
          disabled={syncing}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "10px 12px", borderRadius: "var(--radius-buttons)", border: "1px solid var(--color-graphite-black)",
            background: syncing ? "var(--bg-subtle)" : "transparent",
            color: "var(--color-graphite-black)", cursor: syncing ? "not-allowed" : "pointer",
            fontSize: "var(--text-body-sm)", fontWeight: 600, fontFamily: "inherit", letterSpacing: "var(--tracking-body-sm)",
            transition: "all 0.12s", opacity: syncing ? 0.6 : 1,
          }}
          onMouseEnter={(e) => { if (!syncing) e.currentTarget.style.background = "var(--hover-bg)"; }}
          onMouseLeave={(e) => { if (!syncing) e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: syncing ? "spin 0.8s linear infinite" : "none" }}>
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          {syncing ? "Syncing..." : "Sync"}
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: "1 1 220px", minWidth: "160px", position: "relative" }}>
          <input
            type="text"
            placeholder="Filter by account name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingRight: "2rem" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
                padding: "2px", display: "flex",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <SegmentedControl options={filters} value={platformFilter} onChange={setPlatformFilter} />
      </div>

      {/* Account Grid */}
      {loading ? (
        <div className="accounts-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="skeleton" style={{ width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: "70%" }} />
                  <div className="skeleton skeleton-text short" style={{ width: "40%", marginTop: "6px" }} />
                </div>
              </div>
              <div className="skeleton skeleton-row" style={{ marginTop: "1rem", height: "32px" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <p style={{ padding: "1.25rem", color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: 0 }}>
            {search ? "No accounts match your search." : "No connected accounts."}
          </p>
        </div>
      ) : (
        <div className="accounts-grid">
          {filtered.map((a) => {
            const isDual = !!a.igUsername;
            const listId = isDual ? "dual" : "fb";
            return (
              <div key={a.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Top section */}
                <div style={{ padding: "1.25rem 1.25rem 0.75rem", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  {a.profilePictureUrl ? (
                    <img src={a.profilePictureUrl} alt="" style={{ width: "44px", height: "44px", borderRadius: "var(--radius-buttons)", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-buttons)", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)" }}>
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        {a.name}
                      </span>
                      {isDual && (
                        <span style={{
                          fontSize: "0.55rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                          padding: "1px 10px", borderRadius: "9999px",
                          background: "var(--color-canvas-white)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--color-canvas-pale)",
                        }}>
                          Dual
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FbIcon />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{a.name}</span>
                      </div>
                    </div>
                    {isDual && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <IgIcon />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>@{a.igUsername}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ color: "var(--text-subtle)", cursor: "pointer", flexShrink: 0 }}>
                    <DotsIcon />
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ margin: "0 1.25rem", padding: "0.75rem 0", borderTop: "1px solid var(--border-default)", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {a.followersCount != null && (
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Followers</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "1px" }}>{fmtCount(a.followersCount)}</div>
                    </div>
                  )}
                  {a.category && (
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "1px", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.category}</div>
                    </div>
                  )}
                  {!a.category && a.followersCount == null && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>
                      Sync to load stats
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ borderTop: "1px solid var(--border-default)", display: "flex" }}>
                  <Link
                    href={`/posts/new`}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                      padding: "10px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)",
                      textDecoration: "none", transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    Create Post
                  </Link>
                  <a
                    href={`https://facebook.com/${a.pageId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                      padding: "10px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)",
                      textDecoration: "none", transition: "background 0.1s", borderLeft: "1px solid var(--border-default)",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    View Page
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .accounts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1rem;
        }

        @media (max-width: 786px) {
          .accounts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppShell>
  );
}
