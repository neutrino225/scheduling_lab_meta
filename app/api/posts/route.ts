import { NextRequest } from "next/server";
import { apiError, apiSuccess, API_ERRORS } from "@/lib/api/errors";
import {
  parseJsonBody,
  validateRequired,
  validatePlatform,
  validateMediaType,
  validateTimestamp,
} from "@/lib/api/validation";
import { createPost } from "@/lib/posts/service";
import { accountExists } from "@/lib/accounts/service";

interface CreatePostRequest {
  accountId: string;
  caption?: string;
  platform: string;
  scheduledAt?: number;
  media?: Array<{ url: string; type: string }>;
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await parseJsonBody<CreatePostRequest>(req);

    if (!body) {
      return apiError(
        API_ERRORS.BAD_REQUEST.code,
        "Invalid JSON request body",
        API_ERRORS.BAD_REQUEST.status
      );
    }

    // Validate required fields
    const requiredValidation = validateRequired(body, [
      "accountId",
      "platform",
    ]);
    if (!requiredValidation.valid) {
      return apiError(
        API_ERRORS.VALIDATION_ERROR.code,
        "Validation failed",
        API_ERRORS.VALIDATION_ERROR.status,
        { errors: requiredValidation.errors }
      );
    }

    // Validate platform
    const platformValidation = validatePlatform(body.platform);
    if (!platformValidation.valid) {
      return apiError(
        API_ERRORS.VALIDATION_ERROR.code,
        platformValidation.error || "Invalid platform",
        API_ERRORS.VALIDATION_ERROR.status
      );
    }

    // Validate account exists
    const accountValid = await accountExists(body.accountId);
    if (!accountValid) {
      return apiError(
        API_ERRORS.NOT_FOUND.code,
        `Account not found: ${body.accountId}`,
        API_ERRORS.NOT_FOUND.status
      );
    }

    // Validate scheduledAt if provided
    if (body.scheduledAt !== undefined) {
      const tsValidation = validateTimestamp(body.scheduledAt, "scheduledAt");
      if (!tsValidation.valid) {
        return apiError(
          API_ERRORS.VALIDATION_ERROR.code,
          tsValidation.error || "Invalid scheduledAt",
          API_ERRORS.VALIDATION_ERROR.status
        );
      }
    }

    // Validate media if provided
    if (body.media && Array.isArray(body.media)) {
      for (let i = 0; i < body.media.length; i++) {
        const m = body.media[i];

        if (!m.url || typeof m.url !== "string") {
          return apiError(
            API_ERRORS.VALIDATION_ERROR.code,
            `media[${i}].url is required and must be a string`,
            API_ERRORS.VALIDATION_ERROR.status
          );
        }

        const typeValidation = validateMediaType(m.type);
        if (!typeValidation.valid) {
          return apiError(
            API_ERRORS.VALIDATION_ERROR.code,
            `media[${i}]: ${typeValidation.error}`,
            API_ERRORS.VALIDATION_ERROR.status
          );
        }
      }
    }

    // Create post
    const result = await createPost({
      accountId: body.accountId,
      caption: body.caption,
      platform: body.platform as "facebook" | "instagram",
      scheduledAt: body.scheduledAt,
      media: body.media?.map((m) => ({
        url: m.url,
        type: m.type as "image" | "video",
      })),
    });

    return apiSuccess(result, 201);
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return apiError(
      API_ERRORS.INTERNAL_ERROR.code,
      "Failed to create post",
      API_ERRORS.INTERNAL_ERROR.status
    );
  }
}
