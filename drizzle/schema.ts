import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),

    platform: text("platform").notNull(),
    // 'facebook' | 'instagram'

    name: text("name").notNull(),

    pageId: text("page_id"),
    igUserId: text("ig_user_id"),

    accessToken: text("access_token").notNull(),
    tokenExpiresAt: integer("token_expires_at"),
    profilePictureUrl: text("profile_picture_url"),
  },
  (t) => [
    check("platform_check", sql`${t.platform} IN ('facebook', 'instagram')`),
  ]
);

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),

    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),

    caption: text("caption"),

    platform: text("platform").notNull(),
    // redundant but useful for filtering

    status: text("status").notNull().default("draft"),
    // draft | scheduled | processing | published | failed

    scheduledAt: integer("scheduled_at"),
    publishedAt: integer("published_at"),

    error: text("error"),

    createdAt: integer("created_at")
      .notNull()
      .default(sql`(cast(unixepoch() * 1000 as integer))`),
  },
  (t) => [
    index("posts_account_id_idx").on(t.accountId),
    index("posts_status_scheduled_at_idx").on(t.status, t.scheduledAt),
    check("status_check", sql`${t.status} IN ('draft', 'scheduled', 'processing', 'published', 'failed')`),
    check("platform_check", sql`${t.platform} IN ('facebook', 'instagram')`),
  ]
);

export const media = sqliteTable(
  "media",
  {
    id: text("id").primaryKey(),

    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),

    url: text("url").notNull(),

    type: text("type").notNull(),
    // image | video

    orderIndex: integer("order_index").notNull().default(0),
  },
  (t) => [
    index("media_post_id_idx").on(t.postId),
    check("type_check", sql`${t.type} IN ('image', 'video')`),
  ]
);

export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey(),

    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),

    runAt: integer("run_at").notNull(),

    status: text("status").notNull().default("pending"),
    // pending | running | done | failed

    attempts: integer("attempts").notNull().default(0),
    lockedAt: integer("locked_at"),

    lastError: text("last_error"),
  },
  (t) => [
    index("jobs_run_at_idx").on(t.runAt),
    index("jobs_status_run_at_idx").on(t.status, t.runAt),
    index("jobs_locked_at_idx").on(t.lockedAt),
    check("status_check", sql`${t.status} IN ('pending', 'running', 'done', 'failed')`),
  ]
);
