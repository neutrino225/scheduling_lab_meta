import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts } from "@/drizzle/schema";
import type { InferInsertModel } from "drizzle-orm";
import { v4 as uuid } from "uuid";

type NewAccount = InferInsertModel<typeof accounts>;

/**
 * Get all accounts
 */
export async function listAccounts() {
  return db.select().from(accounts);
}

/**
 * Get account by ID
 */
export async function getAccountById(id: string) {
  const result = await db.select().from(accounts).where(eq(accounts.id, id));
  return result[0] || null;
}

/**
 * Check if account exists
 */
export async function accountExists(id: string): Promise<boolean> {
  const result = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, id));
  return result.length > 0;
}

/**
 * Create a new account
 */
export async function createAccount(data: NewAccount) {
  const [account] = await db.insert(accounts).values(data).returning();
  return account;
}

/**
 * Update an account
 */
export async function updateAccount(id: string, data: Partial<NewAccount>) {
  const [account] = await db
    .update(accounts)
    .set(data)
    .where(eq(accounts.id, id))
    .returning();
  return account;
}

/**
 * Batch-sync profile pictures and page data for all Facebook pages
 */
/**
 * Fetch a single page's profile picture using its own Page Access Token
 */
async function fetchPagePicture(pageId: string, accessToken: string): Promise<string | null> {
  const baseUrl = process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com";
  const version = process.env.META_GRAPH_VERSION || "v20.0";

  try {
    const url = new URL(`${baseUrl}/${version}/${pageId}/picture`);
    url.searchParams.set("redirect", "0");
    url.searchParams.set("type", "large");
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;

    const body = await res.json();
    return body.data?.url || null;
  } catch {
    return null;
  }
}

interface PageData {
  id: string;
  name?: string;
  access_token?: string;
  category?: string;
  followers_count?: number;
  picture?: { data?: { url?: string } };
  instagram_business_account?: { id?: string; username?: string; profile_picture_url?: string };
}

/**
 * Full batch sync: fetches enriched page data + profile pictures
 * Also imports new pages if they are discovered
 */
export async function syncAllProfilePictures(manualToken?: string) {
  const baseUrl = process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com";
  const version = process.env.META_GRAPH_VERSION || "v20.0";
  const userToken = manualToken || process.env.META_ACCESS_TOKEN;

  if (userToken) {
    try {
      const fields = "name,id,access_token,category,followers_count,instagram_business_account{id,username,profile_picture_url},picture.type(large)";
      const url = new URL(`${baseUrl}/${version}/me/accounts`);
      url.searchParams.set("fields", fields);
      url.searchParams.set("access_token", userToken);

      console.log(`[accounts] Batch sync: GET ${url.host}${url.pathname}?fields=...&access_token=***${userToken.slice(-4)}`);

      const res = await fetch(url.toString(), { cache: "no-store" });
      
      if (res.ok) {
        const body = await res.json();
        const pages: PageData[] = body.data || [];
        console.log(`[accounts] Batch sync: got ${pages.length} pages from Meta`);

        let updated = 0;
        let inserted = 0;

        for (const page of pages) {
          const ig = page.instagram_business_account;
          const data: Record<string, any> = {};

          if (page.picture?.data?.url) data.profilePictureUrl = page.picture.data.url;
          if (page.name) data.name = page.name;
          if (page.access_token) data.accessToken = page.access_token;
          if (page.category) data.category = page.category;
          if (page.followers_count != null) data.followersCount = page.followers_count;
          if (ig?.id) data.igUserId = ig.id;
          if (ig?.username) data.igUsername = ig.username;
          if (ig?.profile_picture_url) data.igProfilePictureUrl = ig.profile_picture_url;

          if (Object.keys(data).length === 0) continue;

          const result = await db.update(accounts).set(data).where(eq(accounts.pageId, page.id));
          if (result.changes > 0) {
            updated++;
          } else if (page.access_token) {
            // New page discovered, import it
            await db.insert(accounts).values({
              id: uuid(),
              platform: "facebook",
              name: page.name || "Unknown Page",
              pageId: page.id,
              accessToken: page.access_token,
              profilePictureUrl: data.profilePictureUrl || null,
              category: data.category || null,
              followersCount: data.followersCount || null,
              igUserId: data.igUserId || null,
              igUsername: data.igUsername || null,
              igProfilePictureUrl: data.igProfilePictureUrl || null,
            });
            inserted++;
          }
        }
        console.log(`[accounts] Batch sync done — ${updated} updated, ${inserted} inserted`);
        return;
      }

      const errBody = await res.text().catch(() => "no body");
      console.log(`[accounts] Batch sync failed (${res.status})`);
      console.log(`[accounts] Batch error: ${errBody}`);
    } catch (error) {
      console.error("[accounts] Batch sync error:", error);
    }
  }

  // Strategy 2: per-account fallback (profile picture only)
  console.log("[accounts] Per-account fallback sync...");
  const allAccounts = await db.select().from(accounts);
  let updatedCount = 0;

  for (const account of allAccounts) {
    if (!account.pageId || !account.accessToken) continue;

    const picUrl = await fetchPagePicture(account.pageId, account.accessToken);
    if (picUrl) {
      await db.update(accounts).set({ profilePictureUrl: picUrl }).where(eq(accounts.id, account.id));
      updatedCount++;
    }
  }

  console.log(`[accounts] Per-account sync done — ${updatedCount} accounts updated`);
}
