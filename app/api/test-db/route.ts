import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

import { accounts, posts, media, jobs } from "@/drizzle/schema";
import { db } from "@/lib/db";

export async function GET() {
  // Dev-only endpoint — reject in production
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  // Seed test Facebook account (idempotent via onConflictDoNothing)
  await db
    .insert(accounts)
    .values({
      id: "test-fb-account-001",
      platform: "facebook",
      name: "Test Facebook Page",
      pageId: "123456789",
      accessToken: "test-token-facebook-long-lived",
    })
    .onConflictDoNothing();

  // Seed test Instagram account (idempotent via onConflictDoNothing)
  await db
    .insert(accounts)
    .values({
      id: "test-ig-account-001",
      platform: "instagram",
      name: "Test Instagram Business",
      igUserId: "987654321",
      accessToken: "test-token-instagram-long-lived",
    })
    .onConflictDoNothing();

  // Create test posts and media for demonstration
  const now = Date.now();

  // Test Facebook post (text-only draft)
  const fbPostId = uuid();
  await db.insert(posts).values({
    id: fbPostId,
    accountId: "test-fb-account-001",
    caption: "Hello from Meta Lab - Facebook text post",
    platform: "facebook",
    status: "draft",
    createdAt: now,
  });

  // Test Instagram post with media (scheduled)
  const igPostId = uuid();
  const igMediaId = uuid();
  const scheduledTime = now + 60000; // Schedule 1 minute from now

  await db.insert(posts).values({
    id: igPostId,
    accountId: "test-ig-account-001",
    caption: "Hello from Meta Lab - Instagram scheduled post",
    platform: "instagram",
    status: "scheduled",
    scheduledAt: scheduledTime,
    createdAt: now,
  });

  await db
    .insert(jobs)
    .values({
      id: uuid(),
      postId: igPostId,
      runAt: scheduledTime,
      status: "pending",
      attempts: 0,
    })
    .onConflictDoNothing();

  // Add media to Instagram post
  await db.insert(media).values({
    id: igMediaId,
    postId: igPostId,
    url: "https://example.com/test-image.jpg",
    type: "image",
    orderIndex: 0,
  });

  // Test Facebook post with image (scheduled)
  const fbImagePostId = uuid();
  const fbMediaId = uuid();

  await db.insert(posts).values({
    id: fbImagePostId,
    accountId: "test-fb-account-001",
    caption: "Hello from Meta Lab - Facebook scheduled photo",
    platform: "facebook",
    status: "scheduled",
    scheduledAt: scheduledTime,
    createdAt: now,
  });

  await db
    .insert(jobs)
    .values({
      id: uuid(),
      postId: fbImagePostId,
      runAt: scheduledTime,
      status: "pending",
      attempts: 0,
    })
    .onConflictDoNothing();

  // Add media to Facebook post
  await db.insert(media).values({
    id: fbMediaId,
    postId: fbImagePostId,
    url: "https://example.com/test-photo.jpg",
    type: "image",
    orderIndex: 0,
  });

  const allPosts = await db.select().from(posts);
  const allAccounts = await db.select().from(accounts);

  return NextResponse.json({
    success: true,
    message: "Test seed data created",
    accounts: allAccounts.map(acc => ({
      id: acc.id,
      platform: acc.platform,
      name: acc.name,
      pageId: acc.pageId,
      igUserId: acc.igUserId,
    })),
    posts: allPosts,
  });
}
