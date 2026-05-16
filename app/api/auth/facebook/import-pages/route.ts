import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts } from "@/drizzle/schema";
import { apiSuccess, apiError, API_ERRORS } from "@/lib/api/errors";

interface PageEntry {
  name: string;
  id: string;
  access_token?: string;
  category?: string;
}

export async function POST(req: Request) {
  try {
    let token = process.env.META_ACCESS_TOKEN;

    // Allow passing token in body for manual re-auth
    try {
      const body = await req.json();
      if (body.token) token = body.token;
    } catch {
      // ignore if no body
    }

    if (!token) {
      return apiError("CONFIG_ERROR", "META_ACCESS_TOKEN is not set and no token provided", 400);
    }

    const apiVersion = process.env.META_GRAPH_VERSION || "v20.0";
    const baseUrl = process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com";

    const res = await fetch(
      `${baseUrl}/${apiVersion}/me/accounts?fields=name,id,access_token,category&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return apiError("GRAPH_API_ERROR", "Failed to fetch pages", 400, { error: err });
    }

    const data = await res.json() as { data: PageEntry[] };
    const pages = data.data.filter((p) => p.access_token);

    if (pages.length === 0) {
      return apiError("NO_PAGES", "No pages found with access tokens", 404);
    }

    const allAccountIds = (
      await db.select({ pageId: accounts.pageId }).from(accounts)
    )
      .map((a) => a.pageId)
      .filter(Boolean);

    const inserted: { id: string; name: string; pageId: string }[] = [];
    const updated: { pageId: string; name: string }[] = [];

    for (const page of pages) {
      if (allAccountIds.includes(page.id)) {
        await db
          .update(accounts)
          .set({ accessToken: page.access_token!, name: page.name })
          .where(eq(accounts.pageId, page.id));
        updated.push({ pageId: page.id, name: page.name });
      } else {
        const id = uuid();
        await db.insert(accounts).values({
          id,
          platform: "facebook",
          name: page.name,
          pageId: page.id,
          accessToken: page.access_token!,
          tokenExpiresAt: null,
        });
        inserted.push({ id, name: page.name, pageId: page.id });
      }
    }

    return apiSuccess({
      imported: inserted.length,
      updated: updated.length,
      total: pages.length,
      accounts: inserted,
      refreshed: updated,
    });
  } catch (err) {
    return apiError(
      API_ERRORS.INTERNAL_ERROR.code,
      err instanceof Error ? err.message : "Unknown error",
      API_ERRORS.INTERNAL_ERROR.status
    );
  }
}
