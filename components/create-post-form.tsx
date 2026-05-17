"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { postJson } from "@/lib/client/api";
import type { Account, Post } from "@/lib/client/types";
import { Select, Textarea, Button, DatePicker, TimePicker } from "@/components/primitives";
import { SegmentedControl } from "@/components/primitives/segmented-control";
import { FileUpload } from "@/components/primitives/file-upload";
import { PostPreview } from "@/components/post-preview";
import "@/app/components.css";

interface CreatedPostResponse { post: Post }
interface UploadedFile { key: string; publicUrl: string; type: "image" | "video"; name: string }

function toLocalDate(ts: number) {
  const d = new Date(ts);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

type PreviewView = "mobile" | "desktop";
type PlatformTab = "facebook" | "instagram";

export function CreatePostForm({ initialAccounts }: { initialAccounts: Account[] }) {
  const [accounts] = useState<Account[]>(initialAccounts);
  const [platform, setPlatform] = useState<PlatformTab>("facebook");
  const [accountId, setAccountId] = useState("");
  const [caption, setCaption] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [previewView, setPreviewView] = useState<PreviewView>("mobile");

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      const fb = accounts.find((a) => a.platform === "facebook") || accounts[0];
      setAccountId(fb.id);
      setPlatform(fb.platform);
    }
  }, [accounts, accountId]);

  const handleUpload = useCallback((result: UploadedFile) => {
    setUploaded((prev) => [...prev, result]);
  }, []);

  const removeUpload = useCallback((key: string) => {
    setUploaded((prev) => prev.filter((f) => f.key !== key));
  }, []);

  const reorderUpload = useCallback((from: number, to: number) => {
    setUploaded((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    if (platform === "instagram") {
      return accounts.filter((a) => a.platform === "instagram" || a.igUserId);
    }
    return accounts.filter((a) => a.platform === "facebook");
  }, [accounts, platform]);

  const selectedAccount = useMemo(() => accounts.find((a) => a.id === accountId), [accounts, accountId]);
  const accountName = selectedAccount?.name || "Your Page";

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((a) => a.id === accountId)) {
      setAccountId(filtered[0].id);
    }
  }, [filtered, accountId]);

  async function handleSubmit(mode: "draft" | "schedule") {
    setError(null);
    setSuccess(null);

    if (!accountId) { setError("Select an account."); return; }
    if (platform === "instagram" && uploaded.length === 0) { setError("Instagram posts require at least one image or video."); return; }

    let scheduledTs: number | undefined;
    if (mode === "schedule") {
      if (!scheduledDate || !scheduledTime) {
        setError("Set a date and time to schedule, or save as draft.");
        return;
      }
      scheduledTs = new Date(`${scheduledDate}T${scheduledTime}:00`).getTime();
      if (isNaN(scheduledTs)) { setError("Invalid schedule time."); return; }
      if (scheduledTs <= Date.now()) {
        setError("Schedule time must be in the future.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await postJson<CreatedPostResponse>("/api/posts", {
        accountId, platform, caption,
        scheduledAt: scheduledTs,
        media: uploaded.length > 0
          ? uploaded.map((f) => ({ url: f.key, type: f.type }))
          : undefined,
      });
      setSuccess(`Post created: ${res.post.id.slice(0, 8)}`);
      setCaption("");
      setUploaded([]);
      setScheduledDate("");
      setScheduledTime("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="create-layout">
      {/* ── Left: Form ── */}
      <div className="form-container">
        <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* ── Platform Tabs + Account ── */}
          <div className="card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-cards)" }}>
            <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border-default)" }}>
              <SegmentedControl
                options={[{ label: "Facebook", value: "facebook" }, { label: "Instagram", value: "instagram" }]}
                value={platform}
                onChange={(t) => { setPlatform(t); if (filtered.length > 0) setAccountId(filtered[0].id); }}
              />
            </div>
            <div style={{ padding: "0.75rem 1.25rem" }}>
              <Select
                label="Target Account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {filtered.length === 0 && <option value="">No accounts connected</option>}
                {filtered.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.igUsername ? ` (@${a.igUsername})` : ""}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* ── Content Card ── */}
          <div className="card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-cards)" }}>
            <div style={{ padding: "0.75rem var(--card-padding)", borderBottom: "1px solid var(--border-default)" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-caption)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Content
              </span>
            </div>
            <div style={{ padding: "0.75rem 1.25rem" }}>
              <Textarea
                label="Post Caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Compose your message..."
                style={{ minHeight: "100px" }}
              />
              <div style={{ fontSize: "0.7rem", color: "var(--text-subtle)", marginTop: "0.25rem", fontFamily: "var(--font-mono)", textAlign: "right" }}>
                {caption.length} chars
              </div>
            </div>
          </div>

          {/* ── Media Card ── */}
          <div className="card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-cards)" }}>
            <div style={{ padding: "0.75rem var(--card-padding)", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-caption)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Media
              </span>
              {uploaded.length > 0 && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>
                  {uploaded.length} file{uploaded.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div style={{ padding: "0.75rem 1.25rem" }}>
              {uploaded.length > 0 ? (
                <>
                  <div className="media-grid">
                    {uploaded.map((f, i) => (
                      <div
                        key={f.key}
                        className="media-grid-item"
                        draggable
                        onDragStart={() => setDragIdx(i)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragIdx === null || dragIdx === i) return;
                          reorderUpload(dragIdx, i);
                          setDragIdx(i);
                        }}
                        onDragEnd={() => setDragIdx(null)}
                        style={{ opacity: dragIdx === i ? 0.35 : 1 }}
                      >
                        <button type="button" onClick={() => removeUpload(f.key)} className="media-grid-remove" title="Remove">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        {f.type === "image" ? (
                          <img src={f.publicUrl} alt="" />
                        ) : (
                          <div className="media-grid-video">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          </div>
                        )}
                        <div className="media-grid-index">{i + 1}</div>
                        {platform === "instagram" && (
                          <div className="media-grid-badge" title="Will be center-cropped to 4:5 on Instagram">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                    <label className="media-grid-add">
                      <input
                        type="file" multiple
                        accept={platform === "facebook" ? "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime" : "image/jpeg,image/png,image/webp,video/mp4"}
                        hidden disabled={submitting}
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files) return;
                          for (const file of files) {
                            const fd = new FormData();
                            fd.append("file", file);
                            fd.append("type", file.type.startsWith("video") ? "video" : "image");
                            try {
                              const res = await fetch("/api/media/upload", { method: "POST", body: fd });
                              if (!res.ok) continue;
                              const data = await res.json();
                              handleUpload({ key: data.key, publicUrl: data.publicUrl, type: file.type.startsWith("video") ? "video" : "image" as "image" | "video", name: file.name });
                            } catch { /* ignore */ }
                          }
                          e.target.value = "";
                        }}
                      />
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </label>
                  </div>
                </>
              ) : (
                <FileUpload platform={platform} onUpload={handleUpload} disabled={submitting} multiple />
              )}
            </div>
          </div>

          {/* ── Scheduling Card ── */}
          <div className="card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-cards)" }}>
            <div style={{ padding: "0.75rem var(--card-padding)", borderBottom: "1px solid var(--border-default)" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-caption)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Scheduling
              </span>
            </div>
            <div style={{ padding: "0.75rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", gap: "var(--space-md, 1rem)", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <DatePicker label="Date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={toLocalDate(Date.now())} />
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <TimePicker label="Time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Submit ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {error && <div style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-buttons)", background: "var(--status-danger-surface)", color: "var(--status-danger)", fontSize: "0.85rem", fontWeight: 500 }}>{error}</div>}
            {success && <div style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-buttons)", background: "var(--status-success-surface)", color: "var(--status-success)", fontSize: "0.85rem", fontWeight: 500 }}>{success}</div>}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => handleSubmit("draft")}
                style={{ flex: 1, height: "40px", fontSize: "0.95rem", fontWeight: 700 }}
              >
                {submitting ? "Processing..." : "Save as Draft"}
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={submitting}
                onClick={() => handleSubmit("schedule")}
                style={{ flex: 1, height: "40px", fontSize: "0.95rem", fontWeight: 700 }}
              >
                {submitting ? "Processing..." : "Schedule"}
              </Button>
            </div>
          </div>

        </form>
      </div>

      {/* ── Right: Preview ── */}
      <div className="preview-column">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            Preview
          </span>
          <SegmentedControl
            options={[
              { label: "Mobile", value: "mobile" as const },
              { label: "Desktop", value: "desktop" as const },
            ]}
            value={previewView}
            onChange={setPreviewView}
          />
        </div>

        <PostPreview
          platform={platform}
          caption={caption}
          media={uploaded.map(f => ({ url: f.publicUrl, type: f.type }))}
          accountName={accountName}
          profilePictureUrl={selectedAccount?.profilePictureUrl}
          view={previewView}
        />
      </div>

      <style>{`
        .create-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: start;
        }

        .form-container {
          width: 100%;
          min-width: 0;
        }

        .preview-column {
          position: sticky;
          top: 2rem;
        }

        @media (min-width: 1200px) {
          .create-layout {
            grid-template-columns: 1fr 480px;
          }
        }

        @media (max-width: 1024px) {
          .create-layout {
            grid-template-columns: 1fr;
          }
          .preview-column {
            position: static;
            order: -1;
            margin-bottom: 1.5rem;
          }
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
          gap: 0.5rem;
        }

        .media-grid-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid var(--border-default);
          background: var(--bg-subtle);
          cursor: grab;
          user-select: none;
        }

        .media-grid-item:active { cursor: grabbing; }

        .media-grid-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .media-grid-video {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          background: var(--bg-muted);
        }

        .media-grid-index {
          position: absolute;
          bottom: 4px;
          left: 4px;
          width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          background: var(--color-graphite-black);
          color: var(--color-canvas-white);
          font-size: 0.6rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono, var(--font-mdio));
          letter-spacing: 0.6px;
        }

        .media-grid-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 22px;
          height: 22px;
          border-radius: var(--radius-full);
          border: none;
          background: var(--color-graphite-black);
          color: var(--color-canvas-white);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.12s;
          z-index: 2;
        }

        .media-grid-item:hover .media-grid-remove {
          opacity: 1;
        }

        .media-grid-remove:hover {
          background: var(--accent-primary);
        }

        .media-grid-badge {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 20px;
          height: 20px;
          border-radius: var(--radius-full);
          background: var(--color-graphite-black);
          color: var(--color-canvas-white);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .media-grid-add {
          aspect-ratio: 1;
          border-radius: var(--radius-cards);
          border: 1px dashed var(--border-default);
          background: transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.12s;
        }

        .media-grid-add:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          background: var(--accent-surface);
        }
      `}</style>
    </div>
  );
}
