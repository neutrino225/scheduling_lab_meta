import { NextRequest } from "next/server";
import { apiError, apiSuccess, API_ERRORS } from "@/lib/api/errors";
import { listPosts } from "@/lib/posts/service";

export async function GET(req: NextRequest) {
  try {
    // Parse query params
    const searchParams = req.nextUrl.searchParams;

    const accountId = searchParams.get("accountId") || undefined;
    const platform = searchParams.get("platform") || undefined;
    const statusParam = searchParams.get("status");
    const status = statusParam ? statusParam.split(",") : undefined;
    const scheduledBeforeParam = searchParams.get("scheduledBefore");
    const scheduledBefore = scheduledBeforeParam ? parseInt(scheduledBeforeParam, 10) : undefined;
    const scheduledAfterParam = searchParams.get("scheduledAfter");
    const scheduledAfter = scheduledAfterParam ? parseInt(scheduledAfterParam, 10) : undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offsetParam = searchParams.get("offset");
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Validate numeric params
    if (isNaN(limit) || limit <= 0) {
      return apiError(
        API_ERRORS.VALIDATION_ERROR.code,
        "limit must be a positive number",
        API_ERRORS.VALIDATION_ERROR.status
      );
    }

    if (isNaN(offset) || offset < 0) {
      return apiError(
        API_ERRORS.VALIDATION_ERROR.code,
        "offset must be a non-negative number",
        API_ERRORS.VALIDATION_ERROR.status
      );
    }

    // Fetch posts
    const result = await listPosts({
      accountId,
      platform,
      status,
      scheduledBefore,
      scheduledAfter,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
    });

    return apiSuccess(result);
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return apiError(
      API_ERRORS.INTERNAL_ERROR.code,
      "Failed to fetch posts",
      API_ERRORS.INTERNAL_ERROR.status
    );
  }
}
