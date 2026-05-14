import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { apiError, apiSuccess, API_ERRORS } from "@/lib/api/errors";
import { listAccounts, createAccount, syncAllProfilePictures } from "@/lib/accounts/service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sync = searchParams.get("sync") === "true";

    const accounts = await listAccounts();
    console.log(`[accounts] GET /api/accounts — sync=${sync}, ${accounts.length} accounts in DB`);

    if (sync) {
      console.log("[accounts] Starting profile picture sync...");
      await syncAllProfilePictures();
      console.log("[accounts] Profile picture sync complete");
    }

    const updatedAccounts = sync ? await listAccounts() : accounts;

    const sanitizedAccounts = updatedAccounts.map((account) => {
      const token = account.accessToken || "";
      const suffix = token.length >= 4 ? token.slice(-4) : token;

      return {
        ...account,
        accessToken: token ? `***${suffix}` : null,
      };
    });

    return apiSuccess(sanitizedAccounts);
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return apiError(
      API_ERRORS.INTERNAL_ERROR.code,
      "Failed to fetch accounts",
      API_ERRORS.INTERNAL_ERROR.status
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      platform: "facebook" | "instagram";
      name: string;
      pageId?: string;
      igUserId?: string;
      accessToken: string;
    };

    if (!body.platform || !body.name || !body.accessToken) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "platform, name, and accessToken are required" },
        { status: 400 }
      );
    }

    if (!["facebook", "instagram"].includes(body.platform)) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "platform must be 'facebook' or 'instagram'" },
        { status: 400 }
      );
    }

    const account = await createAccount({
      id: uuid(),
      platform: body.platform,
      name: body.name,
      pageId: body.pageId || null,
      igUserId: body.igUserId || null,
      accessToken: body.accessToken,
      tokenExpiresAt: null,
    });

    return NextResponse.json({ success: true, account: { ...account, accessToken: undefined } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/accounts error:", error);
    return apiError(
      API_ERRORS.INTERNAL_ERROR.code,
      "Failed to create account",
      API_ERRORS.INTERNAL_ERROR.status
    );
  }
}
