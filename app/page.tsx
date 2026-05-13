"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getApiData } from "@/lib/client/api";
import type { Account, Job, JobSummary, Post } from "@/lib/client/types";
import "@/app/components.css";

function badgeClass(status: string) {
  const map: Record<string, string> = {
    published: "badge-success",
    draft: "badge-muted",
    scheduled: "badge-info",
    processing: "badge-warning",
    failed: "badge-danger",
    done: "badge-success",
    pending: "badge-info",
    running: "badge-warning",
  };
  return map[status] || "badge-muted";
}

function fmtDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState<JobSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [p, j, s, a] = await Promise.all([
          getApiData<Post[]>("/api/posts/list?limit=8"),
          getApiData<Job[]>("/api/jobs?limit=8"),
          getApiData<{ summary: JobSummary }>("/api/jobs?summary=true"),
          getApiData<Account[]>("/api/accounts"),
        ]);
        if (!active) return;
        setPosts(p);
        setJobs(j);
        setSummary(s.summary);
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

  const scheduledCount = useMemo(() => posts.filter((p) => p.status === "scheduled").length, [posts]);
  const todayPublished = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return posts.filter((p) => p.publishedAt && p.publishedAt >= start.getTime()).length;
  }, [posts]);

  const stats = [
    { label: "Scheduled posts", value: scheduledCount, note: "Queued for publish" },
    { label: "Published today", value: todayPublished, note: "Completed since midnight" },
    { label: "Failed jobs", value: summary?.failed || 0, note: "Requires attention" },
    { label: "Connected accounts", value: accounts.length, note: "Available destinations" },
  ];

  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", margin: 0 }}>Dashboard</h1>
      <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 1.5rem", fontSize: "0.875rem" }}>
        Monitor queue health and scheduled content at a glance.
      </p>

      {loading ? (
        <>
          <div className="stats-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card">
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text long" style={{ height: "28px", marginTop: "8px" }} />
                <div className="skeleton skeleton-text short" style={{ marginTop: "8px" }} />
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-header"><div className="skeleton skeleton-text" style={{ width: "140px" }} /></div>
            <div className="card-body" style={{ padding: "1.25rem" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton skeleton-row" />
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="skeleton skeleton-text" style={{ width: "100px" }} /></div>
            <div className="card-body" style={{ padding: "1.25rem" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton skeleton-row" />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-note">{s.note}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-header">Upcoming Posts</div>
            <div className="card-body" style={{ padding: 0 }}>
              {posts.length === 0 ? (
                <p style={{ padding: "1.25rem", color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
                  No posts yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {posts.slice(0, 5).map((post) => (
                    <div key={post.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border-default)",
                      gap: "0.75rem", flexWrap: "wrap",
                    }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "capitalize" }}>
                          {post.platform}
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {post.caption || "No caption"}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className={`badge ${badgeClass(post.status)}`}>{post.status}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>{fmtDate(post.scheduledAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">Recent Jobs</div>
            <div className="card-body" style={{ padding: 0 }}>
              {jobs.length === 0 ? (
                <p style={{ padding: "1.25rem", color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
                  No job activity yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.625rem 1.25rem", borderBottom: "1px solid var(--border-default)",
                      gap: "0.5rem", flexWrap: "wrap",
                    }}>
                      <span className="mono" style={{ color: "var(--text-muted)" }}>{job.id.slice(0, 8)}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className={`badge ${badgeClass(job.status)}`}>{job.status}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>{job.attempts} attempt{job.attempts !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
