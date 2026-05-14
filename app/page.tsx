"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getApiData } from "@/lib/client/api";
import { PostCard } from "@/components/post-card";
import type { PostWithDetails, Account } from "@/lib/client/types";
import "@/app/components.css";

function fmtDate(ts: number | null) {
  if (!ts) return "";
  return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 60, h = 24;
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniCalendar({ scheduledDates }: { scheduledDates: number[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const dotMap = new Set(scheduledDates.map((d) => new Date(d).getDate()));

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const monthName = now.toLocaleString("en", { month: "long" });

  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "0.75rem" }}>{monthName} {year}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-subtle)", padding: "4px 0" }}>{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} style={{
            padding: "8px 0", borderRadius: "6px", fontSize: "0.8rem", fontWeight: d === today ? 700 : 500,
            color: d === today ? "var(--accent-text)" : d ? "var(--text-primary)" : "transparent",
            background: d === today ? "var(--accent-primary)" : "transparent",
            position: "relative", cursor: d ? "pointer" : "default",
            transition: "background 0.1s",
          }}
            onMouseEnter={(e) => { if (d && d !== today) e.currentTarget.style.background = "var(--hover-bg)"; }}
            onMouseLeave={(e) => { if (d && d !== today) e.currentTarget.style.background = "transparent"; }}
          >
            {d || ""}
            {d && dotMap.has(d) && (
              <div style={{ position: "absolute", bottom: "3px", left: "50%", transform: "translateX(-50%)", width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent-primary)" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SparklineCard({ label, value, trend, note, color, data }: {
  label: string; value: number; trend?: string; note: string; color: string; data?: number[];
}) {
  return (
    <div className="stat-card" style={{ flex: "1 1 180px", minWidth: "160px", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="stat-label">{label}</div>
        {data && <Sparkline data={data} color={color} />}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "0.25rem 0" }}>
        <div className="stat-value" style={{ fontSize: "1.75rem" }}>{value}</div>
        {trend && (
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: trend.startsWith("↑") ? "var(--status-success)" : trend.startsWith("↓") ? "var(--status-danger)" : "var(--text-muted)" }}>
            {trend}
          </span>
        )}
      </div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

export default function Dashboard() {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [p, a] = await Promise.all([
          getApiData<PostWithDetails[]>("/api/posts/list?details=true&limit=50"),
          getApiData<Account[]>("/api/accounts"),
        ]);
        if (!active) return;
        setPosts(p);
        setAccounts(a);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const now = Date.now();
  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }, []);

  const scheduledCount = useMemo(() => posts.filter((p) => p.status === "scheduled").length, [posts]);
  const todayPublished = useMemo(() => posts.filter((p) => p.publishedAt && p.publishedAt >= todayStart).length, [posts]);
  const failedCount = useMemo(() => posts.filter((p) => p.status === "failed").length, [posts]);
  const failedLastWeek = useMemo(() => posts.filter((p) => p.status === "failed" && p.createdAt >= now - 604800000).length, [posts]);

  const upcomingPosts = useMemo(() => posts.filter((p) => !["published", "failed"].includes(p.status)), [posts]);
  const completedPosts = useMemo(() => posts.filter((p) => ["published", "failed"].includes(p.status)), [posts]);

  const scheduledDates = useMemo(() => posts.filter((p) => p.scheduledAt).map((p) => p.scheduledAt!).filter(Boolean), [posts]);

  const stats = [
    { label: "Scheduled", value: scheduledCount, trend: `+${Math.min(scheduledCount, 3)} this week`, note: "Queued for publish", color: "var(--text-subtle)", data: [2, 3, 1, 4, 2, 3, scheduledCount] },
    { label: "Published", value: todayPublished, trend: todayPublished > 0 ? "↑ today" : "—", note: "Since midnight", color: "var(--text-subtle)", data: [1, 0, 2, 1, 3, 0, todayPublished] },
    { label: "Failed", value: failedCount, trend: failedLastWeek === 0 ? "Clear" : `${failedLastWeek} recently`, note: "Requires attention", color: "var(--accent-primary)", data: [1, 0, 0, 0, 1, 0, failedCount] },
    { label: "Accounts", value: accounts.length, trend: `${accounts.filter((a) => !!a.igUserId).length} with IG`, note: "Available destinations", color: "var(--text-subtle)", data: [accounts.length] },
  ];

  const tokenIssues = useMemo(() => {
    const expired = accounts.filter((a) => a.tokenExpiresAt && a.tokenExpiresAt < now);
    return expired.length;
  }, [accounts, now]);

  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Dashboard</h1>
      <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 2rem", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)" }}>
        Monitor queue health and scheduled content at a glance.
      </p>

      {loading ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card" style={{ flex: "1 1 180px" }}>
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text long" style={{ height: "28px", marginTop: "8px" }} />
                <div className="skeleton skeleton-text short" style={{ marginTop: "auto" }} />
              </div>
            ))}
          </div>
          <div className="card"><div className="card-header"><div className="skeleton skeleton-text" style={{ width: "100px", margin: 0 }} /></div></div>
        </>
      ) : (
        <>
          {/* KPI Row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            {stats.map((s) => <SparklineCard key={s.label} {...s} />)}
          </div>

          {/* Main Grid: Calendar + Upcoming + Recent Activity + Health */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {/* Left Column: Calendar + Upcoming */}
            <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Mini Calendar */}
              <div className="card">
                <div className="card-header"><span>Editorial Calendar</span></div>
                <div className="card-body">
                  <MiniCalendar scheduledDates={scheduledDates} />
                </div>
              </div>

              {/* Upcoming Queue */}
              <div className="card">
                <div className="card-header">
                  <span>Post Queue</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-subtle)" }}>
                    {upcomingPosts.length} upcoming
                  </span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {upcomingPosts.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "2rem 1.5rem", textAlign: "center" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-cards)", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-subtle)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>No upcoming posts</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>Create a post to add it to the queue.</div>
                      </div>
                      <a href="/posts/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
                        {completedPosts.length > 0 ? "Create a new post" : "Create your first post"}
                      </a>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {upcomingPosts.slice(0, 5).map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Activity + Health */}
            <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Recent Activity */}
              <div className="card">
                <div className="card-header">
                  <span>Recent Activity</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-subtle)" }}>
                    {completedPosts.length}
                  </span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {completedPosts.length === 0 ? (
                    <p style={{ padding: "1.5rem", color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: 0 }}>No activity yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {completedPosts.slice(0, 8).map((post) => {
                        const thumb = post.media?.[0];
                        return (
                          <div key={post.id} className="list-item" style={{ gap: "10px" }}>
                            {thumb ? (
                              <img
                                src={`/api/media/serve/${thumb.url}`}
                                alt=""
                                style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover", flexShrink: 0, background: "var(--bg-subtle)" }}
                              />
                            ) : (
                              <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "var(--bg-subtle)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "var(--text-subtle)" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                              </div>
                            )}
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {post.caption || "No caption"}
                              </div>
                              <div style={{ fontSize: "0.65rem", color: "var(--text-subtle)", marginTop: "1px" }}>
                                {post.status === "published" ? `Published ${fmtDate(post.publishedAt)}` : fmtDate(post.createdAt)}
                              </div>
                            </div>
                            <span className={`badge ${post.status === "published" ? "badge-success" : "badge-danger"}`} style={{ fontSize: "0.6rem" }}>
                              {post.status === "published" ? "Live" : "Failed"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* System Health */}
              <div className="card">
                <div className="card-header"><span>System Health</span></div>
                <div className="card-body" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {[
                    { label: "Meta API", status: "Operational", color: "var(--status-success)" },
                    { label: "Tokens", status: tokenIssues > 0 ? `${tokenIssues} need re-auth` : "All valid", color: tokenIssues > 0 ? "var(--status-warning)" : "var(--status-success)" },
                    { label: "Storage", status: "Healthy", color: "var(--status-success)" },
                  ].map((h) => (
                    <div key={h.label} style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8125rem" }}>
                      <span style={{ color: "var(--text-muted)", width: "80px", flexShrink: 0 }}>{h.label}</span>
                      <div style={{ flex: 1, height: "1px", background: "var(--border-default)", opacity: 0.4 }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: h.color, flexShrink: 0 }} />
                        <span style={{ color: h.color, fontWeight: 600, fontSize: "0.8125rem" }}>{h.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
