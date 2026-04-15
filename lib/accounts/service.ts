import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts } from "@/drizzle/schema";

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
  return db.select().from(accounts).where(eq(accounts.id, id));
}

/**
 * Check if account exists
 */
export async function accountExists(id: string): Promise<boolean> {
  const result = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, id));
  return result.length > 0;
}
