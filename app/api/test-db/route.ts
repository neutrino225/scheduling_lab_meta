import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

import { accounts, posts } from "@/drizzle/schema";
import { db } from "@/lib/db";

export async function GET() {
  // Dev-only endpoint — reject in production
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  // Seed test account (idempotent via onConflictDoNothing)
  await db
    .insert(accounts)
    .values({
      id: "test-account-001",
      platform: "facebook",
      name: "Test account (seed)",
      accessToken: "test-token-facebook-long-lived",
    })
    .onConflictDoNothing();

  // Seed test post (each call creates new post, but references same account)
  await db.insert(posts).values({
    id: uuid(),
    accountId: "test-account-001",
    caption: "hello meta-lab",
    platform: "facebook",
    status: "draft",
    createdAt: Date.now(),
  });

  const all = await db.select().from(posts);

  return NextResponse.json({
    success: true,
    message: "Test seed data created",
    posts: all,
  });
}
