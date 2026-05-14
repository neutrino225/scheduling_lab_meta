import { NextRequest } from "next/server";
import { apiError, apiSuccess, API_ERRORS } from "@/lib/api/errors";
import { listPosts, listPostsWithDetails } from "@/lib/posts/service";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const accountId = sp.get("accountId") || undefined;
    const platform = sp.get("platform") || undefined;
    const statusParam = sp.get("status");
    const status = statusParam ? statusParam.split(",") : undefined;
    const search = sp.get("search") || undefined;
    const sort = sp.get("sort") || undefined;

    const scheduledBeforeParam = sp.get("scheduledBefore");
    const scheduledBefore = scheduledBeforeParam ? parseInt(scheduledBeforeParam, 10) : undefined;
    const scheduledAfterParam = sp.get("scheduledAfter");
    const scheduledAfter = scheduledAfterParam ? parseInt(scheduledAfterParam, 10) : undefined;

    const createdBeforeParam = sp.get("createdBefore");
    const createdBefore = createdBeforeParam ? parseInt(createdBeforeParam, 10) : undefined;
    const createdAfterParam = sp.get("createdAfter");
    const createdAfter = createdAfterParam ? parseInt(createdAfterParam, 10) : undefined;

    const limitParam = sp.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offsetParam = sp.get("offset");
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    const details = sp.get("details") === "true";

    if (isNaN(limit) || limit <= 0) {
      return apiError(API_ERRORS.VALIDATION_ERROR.code, "limit must be a positive number", API_ERRORS.VALIDATION_ERROR.status);
    }

    if (isNaN(offset) || offset < 0) {
      return apiError(API_ERRORS.VALIDATION_ERROR.code, "offset must be a non-negative number", API_ERRORS.VALIDATION_ERROR.status);
    }

    const filters = {
      accountId,
      platform,
      status,
      search,
      sort,
      scheduledBefore,
      scheduledAfter,
      createdBefore,
      createdAfter,
      limit: Math.min(limit, 100),
      offset,
    };

    const result = details ? await listPostsWithDetails(filters) : await listPosts(filters);

    return apiSuccess(result);
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return apiError(API_ERRORS.INTERNAL_ERROR.code, "Failed to fetch posts", API_ERRORS.INTERNAL_ERROR.status);
  }
}
