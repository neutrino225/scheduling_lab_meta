import { NextRequest } from "next/server";
import { apiError, apiSuccess, API_ERRORS } from "@/lib/api/errors";
import { listJobs, countJobsByStatus } from "@/lib/jobs/service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Get query params for filtering
    const statusParam = searchParams.get("status");
    const status = statusParam ? statusParam.split(",") : undefined;
    const postId = searchParams.get("postId") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offsetParam = searchParams.get("offset");
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    const summaryOnly = searchParams.get("summary") === "true";

    // If summary is requested, return status counts
    if (summaryOnly) {
      const counts = await countJobsByStatus();
      return apiSuccess({
        summary: counts,
      });
    }

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

    // Fetch jobs
    const jobs = await listJobs({
      status,
      postId,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
    });

    return apiSuccess(jobs);
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return apiError(
      API_ERRORS.INTERNAL_ERROR.code,
      "Failed to fetch jobs",
      API_ERRORS.INTERNAL_ERROR.status
    );
  }
}
