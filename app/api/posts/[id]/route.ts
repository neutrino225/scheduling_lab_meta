import { NextRequest } from "next/server";
import { apiError, apiSuccess, API_ERRORS } from "@/lib/api/errors";
import { getPost } from "@/lib/posts/service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return apiError(
        API_ERRORS.BAD_REQUEST.code,
        "Post ID is required",
        API_ERRORS.BAD_REQUEST.status
      );
    }

    const result = await getPost(id);

    if (!result) {
      return apiError(
        API_ERRORS.NOT_FOUND.code,
        `Post not found: ${id}`,
        API_ERRORS.NOT_FOUND.status
      );
    }

    return apiSuccess(result);
  } catch (error) {
    console.error("GET /api/posts/[id] error:", error);
    return apiError(
      API_ERRORS.INTERNAL_ERROR.code,
      "Failed to fetch post",
      API_ERRORS.INTERNAL_ERROR.status
    );
  }
}
