import { relations } from "drizzle-orm/relations";
import { posts, jobs, media, accounts } from "./schema";

export const jobsRelations = relations(jobs, ({one}) => ({
	post: one(posts, {
		fields: [jobs.postId],
		references: [posts.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	jobs: many(jobs),
	media: many(media),
	account: one(accounts, {
		fields: [posts.accountId],
		references: [accounts.id]
	}),
}));

export const mediaRelations = relations(media, ({one}) => ({
	post: one(posts, {
		fields: [media.postId],
		references: [posts.id]
	}),
}));

export const accountsRelations = relations(accounts, ({many}) => ({
	posts: many(posts),
}));