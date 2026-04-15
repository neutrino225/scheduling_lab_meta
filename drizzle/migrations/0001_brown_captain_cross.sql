PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`name` text NOT NULL,
	`page_id` text,
	`ig_user_id` text,
	`access_token` text NOT NULL,
	`token_expires_at` integer,
	CONSTRAINT "platform_check" CHECK("__new_accounts"."platform" IN ('facebook', 'instagram'))
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "platform", "name", "page_id", "ig_user_id", "access_token", "token_expires_at") SELECT "id", "platform", "name", "page_id", "ig_user_id", "access_token", "token_expires_at" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`run_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`locked_at` integer,
	`last_error` text,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "status_check" CHECK("__new_jobs"."status" IN ('pending', 'running', 'done', 'failed'))
);
--> statement-breakpoint
INSERT INTO `__new_jobs`("id", "post_id", "run_at", "status", "attempts", "locked_at", "last_error") SELECT "id", "post_id", "run_at", "status", "attempts", "locked_at", "last_error" FROM `jobs`;--> statement-breakpoint
DROP TABLE `jobs`;--> statement-breakpoint
ALTER TABLE `__new_jobs` RENAME TO `jobs`;--> statement-breakpoint
CREATE INDEX `jobs_run_at_idx` ON `jobs` (`run_at`);--> statement-breakpoint
CREATE INDEX `jobs_status_run_at_idx` ON `jobs` (`status`,`run_at`);--> statement-breakpoint
CREATE INDEX `jobs_locked_at_idx` ON `jobs` (`locked_at`);--> statement-breakpoint
CREATE TABLE `__new_media` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`url` text NOT NULL,
	`type` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "type_check" CHECK("__new_media"."type" IN ('image', 'video'))
);
--> statement-breakpoint
INSERT INTO `__new_media`("id", "post_id", "url", "type", "order_index") SELECT "id", "post_id", "url", "type", "order_index" FROM `media`;--> statement-breakpoint
DROP TABLE `media`;--> statement-breakpoint
ALTER TABLE `__new_media` RENAME TO `media`;--> statement-breakpoint
CREATE INDEX `media_post_id_idx` ON `media` (`post_id`);--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`caption` text,
	`platform` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`scheduled_at` integer,
	`published_at` integer,
	`error` text,
	`created_at` integer DEFAULT (cast(unixepoch() * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "status_check" CHECK("__new_posts"."status" IN ('draft', 'scheduled', 'processing', 'published', 'failed')),
	CONSTRAINT "platform_check" CHECK("__new_posts"."platform" IN ('facebook', 'instagram'))
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "account_id", "caption", "platform", "status", "scheduled_at", "published_at", "error", "created_at") SELECT "id", "account_id", "caption", "platform", "status", "scheduled_at", "published_at", "error", "created_at" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;--> statement-breakpoint
CREATE INDEX `posts_account_id_idx` ON `posts` (`account_id`);--> statement-breakpoint
CREATE INDEX `posts_status_scheduled_at_idx` ON `posts` (`status`,`scheduled_at`);