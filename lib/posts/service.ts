import { eq, and, gte, lte, inArray, desc, asc, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, media, jobs, accounts } from "@/drizzle/schema";
import { v4 as uuid } from "uuid";

export interface CreatePostPayload {
  accountId: string;
  caption?: string;
  platform: "facebook" | "instagram";
  scheduledAt?: number; // Unix ms epoch — if provided, post is auto-scheduled
  media?: Array<{
    url: string;
    type: "image" | "video";
  }>;
}

export interface PostWithMediaAndJob {
  post: (typeof posts.$inferSelect);
  media: (typeof media.$inferSelect)[];
  job: (typeof jobs.$inferSelect) | null;
}

/**
 * Create a post with media and optionally schedule it
 * All in one transaction for consistency
 */
export async function createPost(payload: CreatePostPayload): Promise<PostWithMediaAndJob> {
  const postId = uuid();
  const now = Date.now();

  // Determine initial post status
  const isScheduled = payload.scheduledAt && payload.scheduledAt > now;
  const postStatus = isScheduled ? "scheduled" : "draft";

  // Insert post
  await db.insert(posts).values({
    id: postId,
    accountId: payload.accountId,
    caption: payload.caption || "",
    platform: payload.platform,
    status: postStatus,
    scheduledAt: payload.scheduledAt,
    createdAt: now,
  });

  // Insert media if provided
  let insertedMedia: (typeof media.$inferSelect)[] = [];
  if (payload.media && payload.media.length > 0) {
    const mediaValues = payload.media.map((m, index) => ({
      id: uuid(),
      postId,
      url: m.url,
      type: m.type,
      orderIndex: index,
    }));

    await db.insert(media).values(mediaValues);
    insertedMedia = mediaValues;
  }

  // If scheduled, create a job row
  let createdJob: (typeof jobs.$inferSelect) | null = null;
  if (isScheduled && payload.scheduledAt) {
    const jobId = uuid();
    await db.insert(jobs).values({
      id: jobId,
      postId,
      runAt: payload.scheduledAt,
      status: "pending",
      attempts: 0,
    });

    createdJob = {
      id: jobId,
      postId,
      runAt: payload.scheduledAt,
      status: "pending",
      attempts: 0,
      lockedAt: null,
      lastError: null,
    };
  }

  // Fetch created post to return fresh data
  const createdPost = await db.select().from(posts).where(eq(posts.id, postId));

  return {
    post: createdPost[0]!,
    media: insertedMedia,
    job: createdJob,
  };
}

/**
 * Get post by ID with related media and job
 */
export async function getPost(postId: string): Promise<PostWithMediaAndJob | null> {
  const postResult = await db.select().from(posts).where(eq(posts.id, postId));

  if (!postResult.length) {
    return null;
  }

  const post = postResult[0]!;

  const mediaResult = await db.select().from(media).where(eq(media.postId, postId));

  const jobResult = await db.select().from(jobs).where(eq(jobs.postId, postId));

  return {
    post,
    media: mediaResult,
    job: jobResult[0] || null,
  };
}

/**
 * List posts with optional filtering
 */
export type PostFilter = {
  accountId?: string;
  platform?: string;
  status?: string[];
  search?: string;
  sort?: string;
  scheduledBefore?: number;
  scheduledAfter?: number;
  createdBefore?: number;
  createdAfter?: number;
  limit?: number;
  offset?: number;
};

function buildPostConditions(filters?: PostFilter) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereConditions: any[] = [];

  if (filters?.accountId) {
    whereConditions.push(eq(posts.accountId, filters.accountId));
  }

  if (filters?.platform) {
    whereConditions.push(eq(posts.platform, filters.platform));
  }

  if (filters?.status && filters.status.length > 0) {
    whereConditions.push(inArray(posts.status, filters.status));
  }

  if (filters?.search) {
    whereConditions.push(like(posts.caption, `%${filters.search}%`));
  }

  if (filters?.scheduledBefore) {
    whereConditions.push(lte(posts.scheduledAt, filters.scheduledBefore));
  }

  if (filters?.scheduledAfter) {
    whereConditions.push(gte(posts.scheduledAt, filters.scheduledAfter));
  }

  if (filters?.createdBefore) {
    whereConditions.push(lte(posts.createdAt, filters.createdBefore));
  }

  if (filters?.createdAfter) {
    whereConditions.push(gte(posts.createdAt, filters.createdAfter));
  }

  return whereConditions;
}

const sortMap: Record<string, unknown> = {
  createdAt_desc: desc(posts.createdAt),
  createdAt_asc: asc(posts.createdAt),
  scheduledAt_desc: desc(posts.scheduledAt),
  scheduledAt_asc: asc(posts.scheduledAt),
  publishedAt_desc: desc(posts.publishedAt),
  publishedAt_asc: asc(posts.publishedAt),
  status_asc: asc(posts.status),
  status_desc: desc(posts.status),
};

function resolveOrderBy(sort?: string) {
  return (sort && sortMap[sort]) || desc(posts.createdAt);
}

export async function listPosts(filters?: PostFilter) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereConditions = buildPostConditions(filters);
  if (filters?.accountId) {
    whereConditions.push(eq(posts.accountId, filters.accountId));
  }

  if (filters?.platform) {
    whereConditions.push(eq(posts.platform, filters.platform));
  }

  if (filters?.status && filters.status.length > 0) {
    whereConditions.push(inArray(posts.status, filters.status));
  }

  if (filters?.scheduledBefore) {
    whereConditions.push(lte(posts.scheduledAt, filters.scheduledBefore));
  }

  if (filters?.scheduledAfter) {
    whereConditions.push(gte(posts.scheduledAt, filters.scheduledAfter));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = db.select().from(posts).orderBy(resolveOrderBy(filters?.sort) as any);

  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions));
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  return query;
}

/**
 * List posts with joined media and account data
 */
export async function listPostsWithDetails(filters?: PostFilter) {
  const whereConditions = buildPostConditions(filters);
  const conditions = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = db.select().from(posts).orderBy(resolveOrderBy(filters?.sort) as any);

  if (conditions) query = query.where(conditions);
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.offset(filters.offset);

  const postRows = (await query) as Array<{ id: string; accountId: string }>;

  if (postRows.length === 0) return [];

  const postIds = postRows.map((p) => p.id);
  const accountIds = [...new Set(postRows.map((p) => p.accountId))];

  const mediaRows = await db
    .select()
    .from(media)
    .where(inArray(media.postId, postIds))
    .orderBy(media.orderIndex);

  const mediaByPostId: Record<string, (typeof mediaRows[0])[]> = {};
  for (const m of mediaRows) {
    if (!mediaByPostId[m.postId]) mediaByPostId[m.postId] = [];
    mediaByPostId[m.postId].push(m);
  }

  const accountRows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      platform: accounts.platform,
      pageId: accounts.pageId,
      igUserId: accounts.igUserId,
      profilePictureUrl: accounts.profilePictureUrl,
      category: accounts.category,
      followersCount: accounts.followersCount,
      igUsername: accounts.igUsername,
    })
    .from(accounts)
    .where(inArray(accounts.id, accountIds));

  const accountById: Record<string, (typeof accountRows[0])> = {};
  for (const a of accountRows) {
    accountById[a.id] = a;
  }

  return postRows.map((p: { id: string; accountId: string }) => ({
    ...p,
    media: mediaByPostId[p.id] || [],
    account: accountById[p.accountId] || null,
  }));
}

/**
 * Update post status
 */
export async function updatePostStatus(
  postId: string,
  status: "draft" | "scheduled" | "processing" | "published" | "failed",
  error?: string
) {
  const updates: Record<string, unknown> = { status };

  if (status === "published") {
    updates.publishedAt = Date.now();
  }

  if (error) {
    updates.error = error;
  }

  return db.update(posts).set(updates).where(eq(posts.id, postId));
}

/**
 * Add media to an existing post
 */
export async function createMedia(payload: {
  postId: string;
  url: string;
  type: "image" | "video";
}) {
  const mediaId = uuid();
  
  // Get the max orderIndex for this post
  const existingMedia = await db
    .select()
    .from(media)
    .where(eq(media.postId, payload.postId));
  
  const orderIndex = existingMedia.length;

  const newMedia = {
    id: mediaId,
    postId: payload.postId,
    url: payload.url,
    type: payload.type,
    orderIndex,
  };

  await db.insert(media).values(newMedia);
  return newMedia;
}

/**
 * Get account for a post (for publishing)
 */
export async function getPostAccount(postId: string) {
  const postResult = await db.select().from(posts).where(eq(posts.id, postId));

  if (!postResult.length) {
    return null;
  }

  const accountResult = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, postResult[0]!.accountId));

  return accountResult[0] || null;
}

/**
 * Reschedule a post: update scheduled time, reset job for retry
 */
export async function reschedulePost(
  postId: string,
  scheduledAt: number
) {
  await db
    .update(posts)
    .set({ scheduledAt, status: "scheduled", error: null })
    .where(eq(posts.id, postId));

  const existingJob = await db
    .select()
    .from(jobs)
    .where(eq(jobs.postId, postId));

  if (existingJob.length > 0) {
    await db
      .update(jobs)
      .set({
        runAt: scheduledAt,
        status: "pending",
        attempts: 0,
        lockedAt: null,
        lastError: null,
      })
      .where(eq(jobs.postId, postId));
  } else {
    const jobId = uuid();
    await db.insert(jobs).values({
      id: jobId,
      postId,
      runAt: scheduledAt,
      status: "pending",
      attempts: 0,
    });
  }

  return getPost(postId);
}
