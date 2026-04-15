CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text,
	`name` text,
	`page_id` text,
	`ig_user_id` text,
	`access_token` text,
	`token_expires_at` integer
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`run_at` integer NOT NULL,
	`status` text,
	`attempts` integer,
	`locked_at` integer,
	`last_error` text,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `jobs_run_at_idx` ON `jobs` (`run_at`);--> statement-breakpoint
CREATE INDEX `jobs_status_run_at_idx` ON `jobs` (`status`,`run_at`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`url` text,
	`type` text,
	`order_index` integer,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_post_id_idx` ON `media` (`post_id`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`caption` text,
	`platform` text,
	`status` text,
	`scheduled_at` integer,
	`published_at` integer,
	`error` text,
	`created_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_account_id_idx` ON `posts` (`account_id`);