"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { patchJson, deleteApiData } from "@/lib/client/api";
import type { PostWithDetails } from "@/lib/client/types";
import { DatePicker, TimePicker, Textarea, Button, Chip, chipVariant, SegmentedControl, Modal } from "@/components/primitives";
import { FileUpload } from "@/components/primitives/file-upload";
import { PostPreview } from "@/components/post-preview";
import "@/app/components.css";

function toLocalDate(ts: number) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function toLocalTime(ts: number) {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

interface UploadedFile { 
  key: string; 
  publicUrl: string; 
  type: "image" | "video"; 
  name: string 
}

export function PostDetailContent({ post, id }: { post: PostWithDetails, id: string }) {
  const router = useRouter();
  const [caption, setCaption] = useState(post.caption || "");
  const [date, setDate] = useState(post.scheduledAt ? toLocalDate(post.scheduledAt) : "");
  const [time, setTime] = useState(post.scheduledAt ? toLocalTime(post.scheduledAt) : "");
  const [uploaded, setUploaded] = useState<UploadedFile[]>(
    post.media.map((m: any) => ({
      key: m.url,
      publicUrl: m.publicUrl,
      type: m.type,
      name: m.url.split("/").pop() || "media",
    }))
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [previewView, setPreviewView] = useState<"mobile" | "desktop">("mobile");

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

  const accountName = post.account?.name || "Your Page";

  async function handleSave() {
    setError(null);

    // Validations
    if (post.platform === "instagram" && uploaded.length === 0) {
      setError("Instagram posts require at least one image or video.");
      return;
    }

    let scheduledAt = post.scheduledAt;
    if (date && time) {
      const [y, m, d] = date.split("-").map(Number);
      const [h, min] = time.split(":").map(Number);
      scheduledAt = new Date(y, m - 1, d, h, min).getTime();
      if (scheduledAt <= Date.now()) {
        setError("Schedule time must be in the future.");
        return;
      }
    }

    setSaving(true);
    try {
      await patchJson(`/api/posts/${id}`, {
        caption,
        scheduledAt,
        media: uploaded.map((f) => ({ url: f.key, type: f.type })),
      });
      router.push("/posts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setShowConfirm(false);
    setError(null);
    try {
      await deleteApiData(`/api/posts/${id}`);
      router.push("/posts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
      setDeleting(false);
    }
  }

  const isEditable = post.status !== "published" && post.status !== "processing";

  return (
    <AppShell>
      <div className="post-detail-layout">
        <div className="edit-column">
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-heading)", margin: 0, letterSpacing: "var(--tracking-heading)" }}>Edit Post</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-body-sm)", letterSpacing: "var(--tracking-body-sm)", margin: "0.25rem 0 0" }}>
              Modify your content and schedule.
            </p>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", flexDirection: "column" }}>
            {/* Status Card */}
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

            {/* Content Card */}
            <div className="card">
              <div className="card-header"><span>Content</span></div>
              <div className="card-body">
                {isEditable ? (
                  <Textarea
                    label="Caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Update your caption..."
                    style={{ minHeight: "120px" }}
                  />
                ) : (
                  <p style={{ fontSize: "var(--text-body-sm)", color: "var(--text-primary)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                    {post.caption || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No caption</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Media Card */}
            <div className="card">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Media</span>
                {uploaded.length > 0 && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>
                    {uploaded.length} file{uploaded.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="card-body">
                {isEditable ? (
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
                      </div>
                    ))}
                    <label className="media-grid-add">
                      <input
                        type="file" multiple
                        accept={post.platform === "facebook" ? "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime" : "image/jpeg,image/png,image/webp,video/mp4"}
                        hidden disabled={saving}
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
                ) : (
                  <div className="media-grid">
                    {uploaded.map((f, i) => (
                      <div key={f.key} className="media-grid-item">
                        {f.type === "image" ? (
                          <img src={f.publicUrl} alt="" />
                        ) : (
                          <div className="media-grid-video">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Card */}
            <div className="card">
              <div className="card-header"><span>Schedule</span></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 180px" }}>
                    <DatePicker 
                      label="Date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      min={toLocalDate(Date.now())}
                      disabled={!isEditable} 
                    />
                  </div>
                  <div style={{ flex: "1 1 220px" }}>
                    <TimePicker 
                      label="Time" 
                      value={time} 
                      onChange={(e) => setTime(e.target.value)}
                      disabled={!isEditable} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              {isEditable && (
                <Button
                  onClick={handleSave}
                  disabled={saving || deleting}
                  variant="primary"
                  style={{ minWidth: "160px" }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              )}
              
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={saving || deleting}
                variant="primary"
                style={{ 
                  minWidth: "160px", 
                  background: "var(--status-danger-surface)", 
                  color: "var(--accent-primary)",
                  borderColor: "var(--accent-primary)"
                }}
              >
                {deleting ? "Deleting..." : "Delete Post"}
              </Button>
            </div>
            {error && <div style={{ color: "var(--accent-primary)", fontSize: "var(--text-body-sm)", marginTop: "0.5rem" }}>{error}</div>}
          </div>
        </div>

        {/* Preview Column */}
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
            platform={post.platform}
            caption={caption}
            media={uploaded.map(f => ({ url: f.publicUrl, type: f.type }))}
            accountName={accountName}
            profilePictureUrl={post.account?.profilePictureUrl}
            view={previewView}
          />
        </div>
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Deletion"
        danger
        footer={
          <>
            <Button onClick={() => setShowConfirm(false)} variant="subtle">Cancel</Button>
            <Button onClick={handleDelete} variant="primary" style={{ background: "var(--status-danger)", borderColor: "var(--status-danger)" }}>Delete Post</Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--text-primary)", lineHeight: 1.5 }}>
          Are you sure you want to delete this post? This action cannot be undone and will remove all associated jobs.
        </p>
      </Modal>

      <style>{`
        .post-detail-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: start;
        }

        @media (min-width: 1200px) {
          .post-detail-layout {
            grid-template-columns: 1fr 480px;
          }
        }

        .edit-column {
          max-width: 800px;
          width: 100%;
        }

        .preview-column {
          position: sticky;
          top: 2rem;
        }

        @media (max-width: 1024px) {
          .preview-column {
            position: static;
            order: -1;
            margin-bottom: 2rem;
          }
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.75rem;
        }

        .media-grid-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: var(--radius-cards);
          overflow: hidden;
          border: 1px solid var(--border-default);
          background: var(--bg-subtle);
          cursor: grab;
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

        .media-grid-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 22px;
          height: 22px;
          border-radius: var(--radius-full);
          border: none;
          background: rgba(0,0,0,0.7);
          color: white;
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
        }

        .media-grid-add {
          aspect-ratio: 1;
          border-radius: var(--radius-cards);
          border: 1px dashed var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
        }

        .media-grid-add:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          background: var(--accent-surface);
        }
      `}</style>
    </AppShell>
  );
}
