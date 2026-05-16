import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { media, posts } from "@/drizzle/schema";
import { deleteFromStorage, getSignedUrl } from "@/lib/minio/client";

export async function listMedia(limit = 50, offset = 0) {
  const results = await db
    .select({
      id: media.id,
      url: media.url,
      type: media.type,
      postId: media.postId,
      postCaption: posts.caption,
      postStatus: posts.status,
      createdAt: posts.createdAt,
    })
    .from(media)
    .innerJoin(posts, eq(media.postId, posts.id))
    .orderBy(desc(media.id))
    .limit(limit)
    .offset(offset);

  // Convert storage keys to loadable URLs
  return Promise.all(
    results.map(async (item) => ({
      ...item,
      url: await getSignedUrl(item.url),
    }))
  );
}

export async function deleteMediaItems(ids: string[]) {
  const items = await db.select().from(media).where(inArray(media.id, ids));
  
  for (const item of items) {
    // Delete from storage
    try {
      await deleteFromStorage(item.url); // url in schema is the storage key
    } catch (err) {
      console.error(`Failed to delete storage for media ${item.id}:`, err);
    }
  }

  // Delete from DB
  return db.delete(media).where(inArray(media.id, ids)).returning();
}
