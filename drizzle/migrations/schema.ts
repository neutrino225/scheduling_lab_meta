import { sqliteTable, AnySQLiteColumn, check, text, integer, index, foreignKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const accounts = sqliteTable("accounts", {
	id: text().primaryKey().notNull(),
	platform: text().notNull(),
	name: text().notNull(),
	pageId: text("page_id"),
	igUserId: text("ig_user_id"),
	accessToken: text("access_token").notNull(),
	tokenExpiresAt: integer("token_expires_at"),
},
(table) => [
	check("platform_check", sql`"posts"."platform" IN ('facebook', 'instagram'`),
	check("status_check", sql`"posts"."status" IN ('draft', 'scheduled', 'processing', 'published', 'failed'`),
	check("type_check", sql`"media"."type" IN ('image', 'video'`),
]);

export const jobs = sqliteTable("jobs", {
	id: text().primaryKey().notNull(),
	postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" } ),
	runAt: integer("run_at").notNull(),
	status: text().default("pending").notNull(),
	attempts: integer().default(0).notNull(),
	lockedAt: integer("locked_at"),
	lastError: text("last_error"),
},
(table) => [
	index("jobs_locked_at_idx").on(table.lockedAt),
	index("jobs_status_run_at_idx").on(table.status, table.runAt),
	index("jobs_run_at_idx").on(table.runAt),
	check("platform_check", sql`"posts"."platform" IN ('facebook', 'instagram'`),
	check("status_check", sql`"posts"."status" IN ('draft', 'scheduled', 'processing', 'published', 'failed'`),
	check("type_check", sql`"media"."type" IN ('image', 'video'`),
]);

export const media = sqliteTable("media", {
	id: text().primaryKey().notNull(),
	postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" } ),
	url: text().notNull(),
	type: text().notNull(),
	orderIndex: integer("order_index").default(0).notNull(),
},
(table) => [
	index("media_post_id_idx").on(table.postId),
	check("platform_check", sql`"posts"."platform" IN ('facebook', 'instagram'`),
	check("status_check", sql`"posts"."status" IN ('draft', 'scheduled', 'processing', 'published', 'failed'`),
	check("type_check", sql`"media"."type" IN ('image', 'video'`),
]);

export const posts = sqliteTable("posts", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" } ),
	caption: text(),
	platform: text().notNull(),
	status: text().default("draft").notNull(),
	scheduledAt: integer("scheduled_at"),
	publishedAt: integer("published_at"),
	error: text(),
	createdAt: integer("created_at").default(sql`(cast(unixepoch() * 1000 as integer))`).notNull(),
},
(table) => [
	index("posts_status_scheduled_at_idx").on(table.status, table.scheduledAt),
	index("posts_account_id_idx").on(table.accountId),
	check("platform_check", sql`"posts"."platform" IN ('facebook', 'instagram'`),
	check("status_check", sql`"posts"."status" IN ('draft', 'scheduled', 'processing', 'published', 'failed'`),
	check("type_check", sql`"media"."type" IN ('image', 'video'`),
]);

