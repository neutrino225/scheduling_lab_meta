"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getApiData } from "@/lib/client/api";
import type { Post } from "@/lib/client/types";
import { Select } from "@/components/primitives";
import "@/app/components.css";

function badgeClass(s: string) {
  const m: Record<string, string> = {
    published: "badge-success", draft: "badge-muted", scheduled: "badge-info",
    processing: "badge-warning", failed: "badge-danger",
  };
  return m[s] || "badge-muted";
}

function fmtDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PostsPage() {
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [platform, setPlatform] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ limit: "100" });
      if (status) params.set("status", status);
      if (platform) params.set("platform", platform);
      try {
        const data = await getApiData<Post[]>(`/api/posts/list?${params}`);
        if (active) setRows(data);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [status, platform]);

  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", margin: 0 }}>Posts</h1>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0", flexWrap: "wrap" }}>
        <div style={{ minWidth: "140px" }}>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="processing">Processing</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
        <div style={{ minWidth: "140px" }}>
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">All platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
          </Select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: "1.25rem" }}>
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
          </div>
        ) : rows.length === 0 ? (
          <p style={{ padding: "1.25rem", color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>No posts found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Caption</th>
                  <th>Status</th>
                  <th>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ textTransform: "capitalize" }}>{row.platform}</td>
                    <td style={{ maxWidth: "240px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-muted)" }}>
                      {row.caption || "—"}
                    </td>
                    <td><span className={`badge ${badgeClass(row.status)}`}>{row.status}</span></td>
                    <td style={{ fontSize: "0.8125rem" }}>{fmtDate(row.scheduledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
