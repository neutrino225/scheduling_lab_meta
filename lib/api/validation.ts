import { NextRequest } from "next/server";

/**
 * Parse and validate JSON request body
 */
export async function parseJsonBody<T>(req: NextRequest): Promise<T | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/**
 * Validate required fields in an object
 */
export function validateRequired(
  obj: unknown,
  fields: string[]
): { valid: boolean; errors?: string[] } {
  if (typeof obj !== "object" || obj === null) {
    return { valid: false, errors: ["Request body must be an object"] };
  }

  const errors: string[] = [];
  for (const field of fields) {
    if (!(field in obj) || (obj as Record<string, unknown>)[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Validate that a value is one of allowed options
 */
export function validateEnum(
  value: unknown,
  allowedValues: string[],
  fieldName: string
): { valid: boolean; error?: string } {
  if (!allowedValues.includes(String(value))) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
    };
  }
  return { valid: true };
}

/**
 * Validate platform value
 */
export function validatePlatform(platform: unknown): { valid: boolean; error?: string } {
  return validateEnum(platform, ["facebook", "instagram"], "platform");
}

/**
 * Validate post status value
 */
export function validatePostStatus(status: unknown): { valid: boolean; error?: string } {
  return validateEnum(
    status,
    ["draft", "scheduled", "processing", "published", "failed"],
    "status"
  );
}

/**
 * Validate media type
 */
export function validateMediaType(type: unknown): { valid: boolean; error?: string } {
  return validateEnum(type, ["image", "video"], "type");
}

/**
 * Validate timestamp is a positive number
 */
export function validateTimestamp(
  value: unknown,
  fieldName: string
): { valid: boolean; error?: string } {
  if (typeof value !== "number" || value <= 0) {
    return { valid: false, error: `${fieldName} must be a positive number (ms epoch)` };
  }
  return { valid: true };
}

/**
 * Validate Instagram post requirements (media is mandatory)
 */
export function validateInstagramPost(payload: {
  platform?: string;
  media?: Array<{ url: string; type: string }>;
}): { valid: boolean; error?: string } {
  if (payload.platform === "instagram") {
    if (!payload.media || payload.media.length === 0) {
      return {
        valid: false,
        error: "Instagram posts require at least one media item (image or video)",
      };
    }
  }
  return { valid: true };
}
