"use client";

import Link from "next/link";
import type { PostWithDetails } from "@/lib/client/types";
import { Chip, chipVariant } from "@/components/primitives/chip";

export function fmtDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PostCard({ post }: { post: PostWithDetails }) {
  const firstMedia = post.media?.[0];
  return (
    <Link href={`/posts/${post.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div className="post-card">
        <div className="post-card-header">
          <div className="post-card-meta">
            <span className="post-card-platform" data-platform={post.platform}>
              {post.platform === "facebook" ? "FB" : "IG"}
            </span>
            <span className="post-card-dot">•</span>
            <span className="post-card-account">{post.account?.name || "Unknown"}</span>
          </div>
          <Chip variant={chipVariant(post.status)}>{post.status}</Chip>
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
    </Link>
  );
}
