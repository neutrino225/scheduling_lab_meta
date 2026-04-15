import { eq, and, lte, inArray, or, isNull, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs } from "@/drizzle/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResult = any;

/**
 * Get all jobs (optional filters)
 */
export async function listJobs(filters?: {
  status?: string[];
  postId?: string;
  limit?: number;
  offset?: number;
}): Promise<QueryResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereConditions: any[] = [];

  if (filters?.status && filters.status.length > 0) {
    whereConditions.push(inArray(jobs.status, filters.status));
  }

  if (filters?.postId) {
    whereConditions.push(eq(jobs.postId, filters.postId));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = db.select().from(jobs);

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
 * Get job by ID
 */
export async function getJobById(id: string) {
  const result = await db.select().from(jobs).where(eq(jobs.id, id));
  return result[0] || null;
}

/**
 * Get job by post ID
 */
export async function getJobByPostId(postId: string) {
  const result = await db.select().from(jobs).where(eq(jobs.postId, postId));
  return result[0] || null;
}

/**
 * Get pending jobs for worker (runAt <= now and status = pending, not locked)
 */
export async function getPendingJobs(now: number) {
  const lockTimeoutMs = 30000; // 30 seconds lock timeout
  const expiredLockTime = now - lockTimeoutMs;

  return db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.status, "pending"),
        lte(jobs.runAt, now),
        // Not locked OR lock expired
        or(isNull(jobs.lockedAt), lte(jobs.lockedAt, expiredLockTime))
      )
    );
}

/**
 * Count jobs by status
 */
export async function countJobsByStatus() {
  const pending = await db
    .select({ count: count() })
    .from(jobs)
    .where(eq(jobs.status, "pending"));
  const running = await db
    .select({ count: count() })
    .from(jobs)
    .where(eq(jobs.status, "running"));
  const done = await db
    .select({ count: count() })
    .from(jobs)
    .where(eq(jobs.status, "done"));
  const failed = await db
    .select({ count: count() })
    .from(jobs)
    .where(eq(jobs.status, "failed"));

  return {
    pending: pending[0]?.count || 0,
    running: running[0]?.count || 0,
    done: done[0]?.count || 0,
    failed: failed[0]?.count || 0,
  };
}
