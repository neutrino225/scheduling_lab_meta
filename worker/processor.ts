/**
 * Job processor: fetches due jobs, locks them, executes, and updates DB
 * Handles retry policy and error recording
 */

import { and, eq, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, posts } from "@/drizzle/schema";
import { getPost, getPostAccount, updatePostStatus } from "@/lib/posts/service";
import { publishFacebookPost } from "@/lib/meta/facebook";
import { publishInstagramPost } from "@/lib/meta/instagram";
import { getPendingJobs } from "@/lib/jobs/service";
import { getSignedUrl } from "@/lib/minio/client";

/**
 * Retry policy configuration
 */
const RETRY_POLICY = {
  maxAttempts: 3,
  backoffByAttempt: {
    1: 2 * 60 * 1000,
    2: 5 * 60 * 1000,
  },
};

/**
 * Update job status and track errors
 */
async function updateJobStatus(
  jobId: string,
  status: "pending" | "running" | "done" | "failed",
  error?: string
) {
  const updates: Record<string, unknown> = { status };

  if (status === "done") {
    // Clear lock on success
    updates.lockedAt = null;
  }

  if (error) {
    updates.lastError = error;
  }

  await db.update(jobs).set(updates).where(eq(jobs.id, jobId));
}

/**
 * Attempt to lock a job atomically
 * Returns true if lock was acquired, false if already locked or failed
 */
async function lockJob(jobId: string, now: number): Promise<boolean> {
  try {
    const lockTimeoutMs = 30000;
    const expiredLockTime = now - lockTimeoutMs;

    const updated = await db
      .update(jobs)
      .set({
        status: "running",
        lockedAt: now,
      })
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.status, "pending"),
          or(isNull(jobs.lockedAt), lte(jobs.lockedAt, expiredLockTime))
        )
      )
      .returning({ id: jobs.id });

    if (!updated.length) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Failed to lock job ${jobId}:`, error);
    return false;
  }
}

/**
 * Reschedule a job with backoff
 */
function getRetryRunAt(nextAttempt: number): number | null {
  const backoff = RETRY_POLICY.backoffByAttempt[
    nextAttempt as keyof typeof RETRY_POLICY.backoffByAttempt
  ];
  if (!backoff) {
    return null; // No more retries
  }
  return Date.now() + backoff;
}

/**
 * Handle job failure with retry logic
 */
async function handleJobFailure(
  jobId: string,
  postId: string,
  error: string,
  currentAttempt: number
) {
  const nextAttempt = currentAttempt + 1;
  const nextRunAt = getRetryRunAt(nextAttempt);

  if (nextRunAt && nextAttempt < RETRY_POLICY.maxAttempts) {
    await db
      .update(jobs)
      .set({
        status: "pending",
        runAt: nextRunAt,
        attempts: nextAttempt,
        lastError: error,
        lockedAt: null,
      })
      .where(eq(jobs.id, jobId));

    await updatePostStatus(postId, "scheduled", error);
    return;
  }

  // Final attempt failed.
  await db
    .update(jobs)
    .set({
      status: "failed",
      attempts: nextAttempt,
      lastError: error,
      lockedAt: null,
    })
    .where(eq(jobs.id, jobId));

  await updatePostStatus(postId, "failed", error);
}

async function resolvePublishableMediaUrl(storedUrl: string | null | undefined) {
  if (!storedUrl) {
    return undefined;
  }

  if (storedUrl.startsWith("http://") || storedUrl.startsWith("https://")) {
    return storedUrl;
  }

  return getSignedUrl(storedUrl);
}

/**
 * Process a single job
 * Returns true if processed, false if skipped (locked, etc.)
 */
export async function processJob(jobId: string): Promise<boolean> {
  const now = Date.now();

  // Try to acquire lock
  const locked = await lockJob(jobId, now);
  if (!locked) {
    console.log(`Job ${jobId} already locked or not found, skipping`);
    return false;
  }

  try {
    // Fetch job details
    const jobResult = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId));

    if (!jobResult.length) {
      console.error(`Job ${jobId} not found after lock`);
      return false;
    }

    const job = jobResult[0];
    const postId = job.postId;

    // Fetch post with account
    const postData = await getPost(postId);
    if (!postData) {
      console.error(`Post ${postId} not found for job ${jobId}`);
      await updateJobStatus(jobId, "failed", "Post not found");
      return false;
    }

    const account = await getPostAccount(postId);
    if (!account) {
      console.error(`Account not found for post ${postId}`);
      await updateJobStatus(jobId, "failed", "Account not found");
      return false;
    }

    // Preflight checks
    if (!account.accessToken) {
      await handleJobFailure(
        jobId,
        postId,
        "Missing account access token",
        job.attempts
      );
      return true;
    }

    if (postData.post.platform === "facebook" && !account.pageId) {
      await handleJobFailure(
        jobId,
        postId,
        "Facebook platform requires pageId",
        job.attempts
      );
      return true;
    }

    if (postData.post.platform === "instagram" && !account.igUserId) {
      await handleJobFailure(
        jobId,
        postId,
        "Instagram platform requires igUserId",
        job.attempts
      );
      return true;
    }

    // Update post status to "processing"
    await updatePostStatus(postId, "processing");

    // Determine media type if media exists
    const hasMedia = postData.media && postData.media.length > 0;
    const mediaType = hasMedia ? (postData.media[0].type as "image" | "video") : undefined;
    const mediaUrl = hasMedia
      ? await resolvePublishableMediaUrl(postData.media[0].url)
      : undefined;

    try {
      // Publish based on platform
      let result;

      if (postData.post.platform === "facebook") {
        result = await publishFacebookPost(
          {
            pageId: account.pageId!,
            accessToken: account.accessToken,
            caption: postData.post.caption || undefined,
            photoUrl: mediaType === "image" ? mediaUrl : undefined,
            videoUrl: mediaType === "video" ? mediaUrl : undefined,
          },
          mediaType
        );
      } else if (postData.post.platform === "instagram") {
        result = await publishInstagramPost(
          {
            igUserId: account.igUserId!,
            accessToken: account.accessToken,
            caption: postData.post.caption || undefined,
            imageUrl: mediaType === "image" ? mediaUrl : undefined,
            videoUrl: mediaType === "video" ? mediaUrl : undefined,
          },
          mediaType
        );
      } else {
        throw new Error(`Unsupported platform: ${postData.post.platform}`);
      }

      // Success: mark job as done and post as published
      await updateJobStatus(jobId, "done");
      await db
        .update(posts)
        .set({
          status: "published",
          publishedAt: now,
          error: null,
        })
        .where(eq(posts.id, postId));

      console.log(
        `✓ Job ${jobId} published to ${postData.post.platform}: ${result.platformPostId}`
      );
      return true;
    } catch (publishError) {
      const errorMsg =
        publishError instanceof Error
          ? publishError.message
          : "Unknown publish error";

      console.error(`✗ Job ${jobId} publish failed: ${errorMsg}`);

      // Handle with retry policy
      await handleJobFailure(jobId, postId, errorMsg, job.attempts);
      return true;
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`✗ Job ${jobId} processing failed: ${errorMsg}`);

    try {
      await updateJobStatus(jobId, "failed", errorMsg);
    } catch (updateError) {
      console.error(`Failed to update job ${jobId} status:`, updateError);
    }

    return true;
  }
}

/**
 * Fetch and process due jobs
 */
export async function processDueJobs(maxConcurrent = 3): Promise<number> {
  const now = Date.now();

  // Fetch due jobs (not locked, status pending, runAt <= now)
  const dueJobs = await getPendingJobs(now);

  if (!dueJobs || dueJobs.length === 0) {
    return 0;
  }

  // Process in batches to avoid overwhelming the system
  const jobsToProcess = dueJobs.slice(0, maxConcurrent);
  const results = await Promise.allSettled(
    jobsToProcess.map((job) => processJob(job.id))
  );

  const processed = results.filter(
    (r) => r.status === "fulfilled" && r.value === true
  ).length;

  console.log(
    `Processed ${processed}/${jobsToProcess.length} due jobs at ${new Date(now).toISOString()}`
  );

  return processed;
}
