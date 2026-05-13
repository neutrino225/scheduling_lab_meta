"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getApiData, postJson } from "@/lib/client/api";
import type { Account, Post } from "@/lib/client/types";
import { Select, Input, Textarea, Button, DatePicker, TimePicker } from "@/components/primitives";
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

export default function NewPostPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [accountId, setAccountId] = useState("");
  const [platform, setPlatform] = useState<"facebook" | "instagram">("facebook");
  const [caption, setCaption] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = useCallback((result: UploadedFile) => {
    setUploaded((prev) => [...prev, result]);
  }, []);

  const removeUpload = useCallback((key: string) => {
    setUploaded((prev) => prev.filter((f) => f.key !== key));
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getApiData<Account[]>("/api/accounts?sync=true");
        if (!active) return;
        setAccounts(data);
        if (data.length > 0) {
          const fb = data.find((a) => a.platform === "facebook") || data[0];
          setAccountId(fb.id);
          setPlatform(fb.platform);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => accounts.filter((a) => a.platform === platform), [accounts, platform]);
  const selectedAccount = useMemo(() => accounts.find((a) => a.id === accountId), [accounts, accountId]);
  const accountName = selectedAccount?.name || "Your Page";

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((a) => a.id === accountId)) {
      setAccountId(filtered[0].id);
    }
  }, [filtered, accountId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!accountId) { setError("Select an account."); return; }
    if (platform === "instagram" && uploaded.length === 0) { setError("Instagram posts require at least one image or video."); return; }

    const scheduledAtStr = (scheduledDate && scheduledTime) ? `${scheduledDate}T${scheduledTime}` : "";
    const scheduledTs = scheduledAtStr ? new Date(scheduledAtStr).getTime() : undefined;
    if (scheduledTs && isNaN(scheduledTs)) { setError("Invalid schedule time."); return; }

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
    <AppShell>
      <div className="page-header" style={{ marginBottom: "var(--space-xl, 2rem)" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>Create Post</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Build and schedule your Meta content.
        </p>
      </div>

      <div className="create-layout">
        {/* Main Form Container */}
        <div className="form-container">
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl, 2rem)" }}>
            
            {/* Row 1: Platform & Account */}
            <div className="form-section">
              <h2 className="section-title">Channel</h2>
              <div className="form-grid-2">
                <Select 
                  label="Platform" 
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value as "facebook" | "instagram")}
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                </Select>

                <Select 
                  label="Target Account" 
                  value={accountId} 
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  {filtered.length === 0 && <option value="">No accounts connected</option>}
                  {filtered.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
              </div>
            </div>

            {/* Row 2: Content */}
            <div className="form-section">
              <h2 className="section-title">Content</h2>
              <Textarea 
                label="Post Caption" 
                value={caption} 
                onChange={(e) => setCaption(e.target.value)} 
                placeholder="Compose your message..."
                style={{ minHeight: "180px" }}
              />
            </div>

            {/* Row 3: Schedule & Media */}
            <div className="form-section">
              <h2 className="section-title">Publishing</h2>
              <div className="form-grid-2" style={{ alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md, 1rem)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md, 1rem)" }}>
                    <DatePicker
                      label="Date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={toLocalDate(Date.now())}
                      required={platform === "instagram"}
                    />
                    <TimePicker
                      label="Time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      required={platform === "instagram"}
                    />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-subtle)", margin: 0 }}>
                    Posts are scheduled in your local timezone.
                  </p>
                </div>
                <FileUpload platform={platform} onUpload={handleUpload} disabled={submitting} />
              </div>
            </div>

            {/* Row 4: Uploaded Media Gallery */}
            {uploaded.length > 0 && (
              <div className="form-section">
                <h2 className="section-title">Media Assets ({uploaded.length})</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--space-sm, 0.5rem)" }}>
                  {uploaded.map((f) => (
                    <div key={f.key} className="media-item-card">
                      {f.type === "image" ? (
                        <img src={f.publicUrl} alt="" className="media-item-thumb" />
                      ) : (
                        <div className="media-item-thumb-placeholder">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </svg>
                        </div>
                      )}
                      <div className="media-item-info">
                        <div className="media-item-name">{f.name}</div>
                        <div className="media-item-type">{f.type}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUpload(f.key)}
                        className="media-item-remove"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer: Errors & Submit */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "flex-end", 
              gap: "var(--space-md, 1rem)", 
              marginTop: "var(--space-sm, 0.5rem)",
              paddingTop: "var(--space-xl, 2rem)",
              borderTop: "1px solid var(--border-default)"
            }}>
              {error && <p style={{ color: "var(--status-danger)", fontSize: "0.875rem", margin: 0, fontWeight: 500 }}>{error}</p>}
              {success && <p style={{ color: "var(--status-success)", fontSize: "0.875rem", margin: 0, fontWeight: 500 }}>{success}</p>}
              <Button type="submit" variant="primary" disabled={submitting} style={{ paddingLeft: "3rem", paddingRight: "3rem", height: "44px" }}>
                {submitting ? "Processing..." : "Create Post"}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview Column */}
        <div className="preview-column">
          <PostPreview 
            platform={platform}
            caption={caption}
            media={uploaded.map(f => ({ url: f.publicUrl, type: f.type }))}
            accountName={accountName}
            profilePictureUrl={selectedAccount?.profilePictureUrl}
          />
        </div>
      </div>

      <style>{`
        .create-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: var(--space-xl, 2rem);
          align-items: start;
        }

        .form-container {
          width: 100%;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-md, 1rem);
        }

        .section-title {
          font-family: var(--font-heading, inherit);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin: 0;
          padding-bottom: var(--space-sm, 0.5rem);
          border-bottom: 1px solid var(--border-default);
        }
        
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-lg, 1.5rem);
        }

        .media-item-card {
          position: relative;
          padding: 0.75rem;
          border-radius: 10px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          gap: var(--space-md, 1rem);
          transition: all 0.2s ease;
        }

        .media-item-card:hover {
          border-color: var(--text-muted);
          background: var(--bg-subtle);
        }

        .media-item-thumb, .media-item-thumb-placeholder {
          width: 52px;
          height: 52px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .media-item-thumb-placeholder {
          background: var(--bg-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .media-item-info {
          min-width: 0;
          flex: 1;
        }

        .media-item-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .media-item-type {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: capitalize;
          margin-top: 2px;
        }

        .media-item-remove {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          font-size: 1.5rem;
          line-height: 1;
          transition: color 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .media-item-remove:hover {
          color: var(--status-danger);
        }

        .preview-column {
          position: sticky;
          top: 2rem;
        }

        @media (min-width: 1400px) {
          .create-layout {
            grid-template-columns: minmax(0, 1fr) 520px;
          }
        }

        @media (max-width: 1024px) {
          .create-layout {
            grid-template-columns: 1fr;
          }
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
          .preview-column {
            position: static;
            order: -1;
            margin-bottom: var(--space-xl, 2rem);
          }
        }
      `}</style>
    </AppShell>
  );
}
