"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getApiData, patchJson } from "@/lib/client/api";
import type { PostWithDetails } from "@/lib/client/types";
import { DatePicker } from "@/components/primitives/date-picker";
import { TimePicker } from "@/components/primitives/time-picker";
import { Chip, chipVariant } from "@/components/primitives/chip";
import "@/app/components.css";

function toLocalDate(ts: number) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function toLocalTime(ts: number) {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<PostWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getApiData<PostWithDetails>(`/api/posts/${id}`)
      .then((p) => {
        setPost(p);
        if (p.scheduledAt) {
          setDate(toLocalDate(p.scheduledAt));
          setTime(toLocalTime(p.scheduledAt));
        }
      })
      .catch(() => setError("Failed to load post"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReschedule() {
    if (!date || !time) return;
    const [y, m, d] = date.split("-").map(Number);
    const [h, min] = time.split(":").map(Number);
    const scheduledAt = new Date(y, m - 1, d, h, min).getTime();

    setSaving(true);
    setError(null);
    try {
      await patchJson(`/api/posts/${id}`, { scheduledAt });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="card"><div className="card-header"><span>Loading...</span></div></div>
      </AppShell>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <div className="card"><div className="card-header"><span>Post not found</span></div></div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Post Details</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: "0.25rem 0 2rem" }}>
        Review and reschedule your content.
      </p>

      <div style={{ display: "flex", gap: "1.5rem", flexDirection: "column", maxWidth: "600px" }}>
        <div className="card">
          <div className="card-header"><span>Status</span></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Chip variant={chipVariant(post.status)}>{post.status}</Chip>
              <span style={{ fontSize: "var(--text-body-sm)", color: "var(--text-muted)" }}>{post.platform}</span>
              {post.account && <span style={{ fontSize: "var(--text-body-sm)", color: "var(--text-primary)", fontWeight: 600 }}>{post.account.name}</span>}
            </div>
            {post.error && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-buttons)", background: "var(--status-danger-surface)", color: "var(--accent-primary)", fontSize: "var(--text-body-sm)", lineHeight: 1.5 }}>
                {post.error}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span>Caption</span></div>
          <div className="card-body">
            <p style={{ fontSize: "var(--text-body-sm)", color: "var(--text-primary)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
              {post.caption || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No caption</span>}
            </p>
          </div>
        </div>

        {(post.status === "failed" || post.status === "scheduled" || post.status === "draft") && (
          <div className="card">
            <div className="card-header"><span>Reschedule</span></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 180px" }}>
                  <DatePicker label="Date" value={date} onChange={(e) => setDate(e.target.value)} min={toLocalDate(Date.now())} />
                </div>
                <div style={{ flex: "1 1 140px" }}>
                  <TimePicker label="Time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
              {error && <div style={{ color: "var(--accent-primary)", fontSize: "var(--text-body-sm)" }}>{error}</div>}
              <button
                onClick={handleReschedule}
                disabled={saving || !date || !time}
                className="btn btn-primary"
                style={{ alignSelf: "flex-start" }}
              >
                {saving ? "Saving..." : "Reschedule & Retry"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
