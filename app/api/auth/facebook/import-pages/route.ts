import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts } from "@/drizzle/schema";

interface PageEntry {
  name: string;
  id: string;
  access_token?: string;
  category?: string;
}

export async function POST() {
  try {
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { code: "CONFIG_ERROR", message: "META_ACCESS_TOKEN is not set" },
        { status: 400 }
      );
    }

    const apiVersion = process.env.META_GRAPH_VERSION || "v20.0";
    const baseUrl = process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com";

    const res = await fetch(
      `${baseUrl}/${apiVersion}/me/accounts?fields=name,id,access_token,category&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { code: "GRAPH_API_ERROR", message: "Failed to fetch pages", error: err },
        { status: 400 }
      );
    }

    const data = await res.json() as { data: PageEntry[] };
    const pages = data.data.filter((p) => p.access_token);

    if (pages.length === 0) {
      return NextResponse.json(
        { code: "NO_PAGES", message: "No pages found with access tokens" },
        { status: 404 }
      );
    }

    const allAccountIds = (
      await db.select({ pageId: accounts.pageId }).from(accounts)
    )
      .map((a) => a.pageId)
      .filter(Boolean);

    const inserted: { id: string; name: string; pageId: string }[] = [];

    for (const page of pages) {
      if (allAccountIds.includes(page.id)) continue;

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

    return NextResponse.json({
      success: true,
      imported: inserted.length,
      total: pages.length,
      accounts: inserted,
    });
  } catch (err) {
    return NextResponse.json(
      {
        code: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
