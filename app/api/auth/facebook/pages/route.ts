import { NextRequest, NextResponse } from "next/server";

interface PageEntry {
  name: string;
  id: string;
  access_token?: string;
  category?: string;
  tasks?: string[];
}

interface AccountsResponse {
  data: PageEntry[];
  paging?: { cursors: { before: string; after: string }; next?: string };
}

interface PermissionEntry {
  permission: string;
  status: string;
}

interface PermissionsResponse {
  data: PermissionEntry[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { accessToken?: string };
    const accessToken = body.accessToken?.trim() || process.env.META_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "accessToken is required (pass in body or set META_ACCESS_TOKEN env)" },
        { status: 400 }
      );
    }

    const apiVersion = process.env.META_GRAPH_VERSION || "v20.0";
    const baseUrl = process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com";

    const [accountsRes, permsRes] = await Promise.all([
      fetch(
        `${baseUrl}/${apiVersion}/me/accounts?fields=name,id,access_token,category,tasks&access_token=${encodeURIComponent(accessToken)}`,
        { cache: "no-store" }
      ),
      fetch(
        `${baseUrl}/${apiVersion}/me/permissions?access_token=${encodeURIComponent(accessToken)}`,
        { cache: "no-store" }
      ),
    ]);

    const accountsData = accountsRes.ok
      ? ((await accountsRes.json()) as AccountsResponse)
      : null;

    const permissions = permsRes.ok
      ? ((await permsRes.json()) as PermissionsResponse)
      : null;

    return NextResponse.json({
      success: accountsRes.ok,
      pages: accountsData?.data ?? [],
      pageCount: accountsData?.data.length ?? 0,
      permissions: permissions?.data ?? [],
      me: await fetch(
        `${baseUrl}/${apiVersion}/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
        { cache: "no-store" }
      ).then((r) => (r.ok ? r.json() : null)),
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
