import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts } from "@/drizzle/schema";
import type { InferInsertModel } from "drizzle-orm";
import { getProfilePicture } from "@/lib/meta/client";

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
 * Sync account profile picture from Meta
 */
export async function syncProfilePicture(accountId: string) {
  const account = await getAccountById(accountId);
  if (!account) return null;

  const metaId = account.platform === "facebook" ? account.pageId : account.igUserId;
  if (!metaId) return null;

  const profileUrl = await getProfilePicture(
    metaId,
    account.accessToken,
    account.platform as "facebook" | "instagram"
  );

  if (profileUrl) {
    await updateAccount(accountId, { profilePictureUrl: profileUrl });
  }

  return profileUrl;
}
