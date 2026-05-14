"use client";

import type { PostWithDetails } from "@/lib/client/types";

export function badgeClass(status: string) {
  const map: Record<string, string> = {
    published: "badge-success",
    draft: "badge-muted",
    scheduled: "badge-info",
    processing: "badge-warning",
    failed: "badge-danger",
  };
  return map[status] || "badge-muted";
}

export function fmtDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PostCard({ post }: { post: PostWithDetails }) {
  const firstMedia = post.media?.[0];
  return (
    <div className="post-card">
      <div className="post-card-header">
        <div className="post-card-meta">
          <span className="post-card-platform" data-platform={post.platform}>
            {post.platform === "facebook" ? "FB" : "IG"}
          </span>
          <span className="post-card-dot">•</span>
          <span className="post-card-account">{post.account?.name || "Unknown"}</span>
        </div>
        <span className={`badge ${badgeClass(post.status)}`}>{post.status}</span>
      </div>

      <div className="post-card-body">
        {firstMedia && (
          <img
            src={`/api/media/serve/${firstMedia.url}`}
            alt=""
            className="post-card-thumb"
            loading="lazy"
          />
        )}
        <p className="post-card-caption">
          {post.caption || "No caption"}
        </p>
      </div>

      <div className="post-card-footer">
        {post.status === "published"
          ? `Published ${fmtDate(post.publishedAt)}`
          : post.scheduledAt
            ? `Scheduled ${fmtDate(post.scheduledAt)}`
            : `Created ${fmtDate(post.createdAt)}`
        }
      </div>
    </div>
  );
}
