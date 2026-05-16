"use client";

import Link from "next/link";
import type { PostWithDetails } from "@/lib/client/types";
import { Chip, chipVariant } from "@/components/primitives/chip";
import { useState } from "react";
import { deleteApiData } from "@/lib/client/api";
import { Modal, Button } from "@/components/primitives";

export function fmtDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PostCard({ post, onDelete }: { post: PostWithDetails, onDelete?: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const firstMedia = post.media?.[0];

  const handleDelete = async () => {
    setDeleting(true);
    setShowConfirm(false);
    try {
      await deleteApiData(`/api/posts/${post.id}`);
      onDelete?.(post.id);
    } catch (err) {
      alert("Failed to delete post");
      setDeleting(false);
    }
  };

  const openConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  return (
    <div style={{ position: "relative" }}>
      <Link href={`/posts/${post.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <div className="post-card" style={{ opacity: deleting ? 0.5 : 1, transition: "opacity 0.2s" }}>
          <div className="post-card-header">
            <div className="post-card-meta">
              <span className="post-card-platform" data-platform={post.platform}>
                {post.platform === "facebook" ? "FB" : "IG"}
              </span>
              <span className="post-card-dot">•</span>
              <span className="post-card-account">{post.account?.name || "Unknown"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingRight: "2.5rem" }}>
              <Chip variant={chipVariant(post.status)}>{post.status}</Chip>
            </div>
          </div>

          <div className="post-card-body">
            {firstMedia && (
              <img
                src={firstMedia.publicUrl || `/api/media/serve/${firstMedia.url}`}
                alt=""
                className="post-card-thumb"
                loading="lazy"
              />
            )}
            <p className="post-card-caption">
              {post.caption || "No caption"}
            </p>
          </div>

          <div className="post-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              {post.status === "published"
                ? `Published ${fmtDate(post.publishedAt)}`
                : post.scheduledAt
                  ? `Scheduled ${fmtDate(post.scheduledAt)}`
                  : `Created ${fmtDate(post.createdAt)}`
              }
            </span>
          </div>
        </div>
      </Link>
      
      <button
        onClick={openConfirm}
        disabled={deleting}
        title="Delete Post"
        style={{
          position: "absolute",
          top: "0.85rem",
          right: "var(--card-padding)",
          background: "none",
          border: "none",
          color: "var(--text-subtle)",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          transition: "all 0.12s",
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--accent-primary)";
          e.currentTarget.style.background = "var(--status-danger-surface)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-subtle)";
          e.currentTarget.style.background = "none";
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>

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
    </div>
  );
}
