"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getApiData } from "@/lib/client/api";
import type { Job, JobSummary } from "@/lib/client/types";
import { Select } from "@/components/primitives";
import "@/app/components.css";
import { Chip, chipVariant } from "@/components/primitives/chip";

function fmtDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function JobsPage() {
  const [summary, setSummary] = useState<JobSummary | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ limit: "100" });
      if (status) params.set("status", status);
      try {
        const [s, j] = await Promise.all([
          getApiData<{ summary: JobSummary }>("/api/jobs?summary=true"),
          getApiData<Job[]>(`/api/jobs?${params}`),
        ]);
        if (!active) return;
        setSummary(s.summary);
        setJobs(j);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [status]);

  const jobStats = summary
    ? [
        { label: "Pending", value: summary.pending },
        { label: "Running", value: summary.running },
        { label: "Done", value: summary.done },
        { label: "Failed", value: summary.failed },
      ]
    : [];

  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Jobs</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: "0.25rem 0 1rem" }}>
        Monitor post publishing jobs, retries, and execution status.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "0.75rem", margin: "1rem 0",
      }}>
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card">
                <div className="skeleton skeleton-text" style={{ width: "50px" }} />
                <div className="skeleton" style={{ height: "24px", width: "30px", marginTop: "8px" }} />
              </div>
            ))
          : jobStats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: "1.5rem" }}>{s.value}</div>
              </div>
            ))
        }
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ minWidth: "140px" }}>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="done">Done</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: "1.25rem" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton skeleton-row" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <p style={{ padding: "1.25rem", color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: 0 }}>No jobs found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Post ID</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Run At</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="mono">{job.id.slice(0, 8)}</td>
                    <td className="mono">{job.postId.slice(0, 8)}</td>
                    <td><Chip variant={chipVariant(job.status)}>{job.status}</Chip></td>
                    <td>{job.attempts}</td>
                    <td style={{ fontSize: "0.8125rem" }}>{fmtDate(job.runAt)}</td>
                    <td style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                      {job.lastError || "—"}
                    </td>
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
