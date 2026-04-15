/**
 * Meta Graph API client utility
 * Handles authentication, request building, error normalization, and retries
 */

import { MetaApiError, GraphApiErrorResponse } from "./types";

/**
 * Configuration for Meta Graph API client
 */
interface MetaClientConfig {
  baseUrl: string;
  version: string;
  dryRun: boolean;
  timeout: number;
}

/**
 * Get client configuration from environment
 */
export function getMetaClientConfig(): MetaClientConfig {
  return {
    baseUrl: process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com",
    version: process.env.META_GRAPH_VERSION || "v20.0",
    dryRun: process.env.META_DRY_RUN === "true",
    timeout: parseInt(process.env.META_GRAPH_TIMEOUT || "30000", 10),
  };
}

/**
 * Check if error is a token-related issue
 */
function isTokenError(code: number, type?: string): boolean {
  // Token expired, invalid, or revoked
  return code === 190 || type === "OAuthException";
}

/**
 * Check if error is rate-limited
 */
function isRateLimit(code: number): boolean {
  return code === 429 || code === 4;
}

/**
 * Normalize Meta API error response into structured error
 */
export function normalizeMetaError(error: unknown): MetaApiError {
  const metaError = new Error() as MetaApiError;
  metaError.isTokenError = false;
  metaError.isRateLimit = false;
  metaError.retryable = false;

  if (error instanceof Error) {
    metaError.message = error.message;
  }

  // Handle Graph API error response
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error
  ) {
    const graphError = error as GraphApiErrorResponse;
    const err = graphError.error;

    metaError.message = err.message;
    metaError.code = err.type;
    metaError.statusCode = err.code;
    metaError.isTokenError = isTokenError(err.code, err.type);
    metaError.isRateLimit = isRateLimit(err.code);
    metaError.retryable = metaError.isRateLimit;
    metaError.raw = error;

    return metaError;
  }

  // Handle HTTP errors
  if (typeof error === "object" && error !== null && "status" in error) {
    const httpError = error as Record<string, unknown>;
    metaError.statusCode = httpError.status as number;
    metaError.isRateLimit = metaError.statusCode === 429;
    metaError.retryable = metaError.isRateLimit;
  }

  return metaError;
}

/**
 * Make authenticated request to Meta Graph API
 * In dry-run mode, returns mocked successful response
 */
export async function makeGraphRequest<T = unknown>(
  endpoint: string,
  accessToken: string,
  method: "GET" | "POST" = "POST",
  params?: Record<string, unknown>,
  config?: MetaClientConfig
): Promise<T> {
  const cfg = config || getMetaClientConfig();

  // Dry-run mode: return mock response
  if (cfg.dryRun) {
    return {
      id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      success: true,
      _dryRun: true,
    } as T;
  }

  // Build URL
  const url = new URL(`${cfg.baseUrl}/${cfg.version}/${endpoint}`);

  // Add access token to query params
  url.searchParams.set("access_token", accessToken);

  // Add other params for GET requests
  if (method === "GET" && params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  try {
    const fetchOptions: RequestInit & { timeout?: number } = {
      method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: cfg.timeout,
    };

    // Add body for POST requests
    if (method === "POST" && params) {
      const body = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          body.set(key, String(value));
        }
      });
      fetchOptions.body = body.toString();
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw normalizeMetaError(errorData);
    }

    return (await response.json()) as T;
  } catch (error) {
    const normalized = normalizeMetaError(error);
    throw normalized;
  }
}

/**
 * Publish a photo to Facebook page
 */
export async function publishFacebookPhoto(
  pageId: string,
  accessToken: string,
  photoUrl: string,
  caption?: string,
  config?: MetaClientConfig
): Promise<{ id: string }> {
  const params: Record<string, unknown> = {
    url: photoUrl,
  };

  if (caption) {
    params.caption = caption;
  }

  return makeGraphRequest<{ id: string }>(
    `${pageId}/photos`,
    accessToken,
    "POST",
    params,
    config
  );
}

/**
 * Publish a video to Facebook page
 */
export async function publishFacebookVideo(
  pageId: string,
  accessToken: string,
  videoUrl: string,
  caption?: string,
  config?: MetaClientConfig
): Promise<{ id: string }> {
  const params: Record<string, unknown> = {
    file_url: videoUrl,
  };

  if (caption) {
    params.title = caption;
    params.description = caption;
  }

  return makeGraphRequest<{ id: string }>(
    `${pageId}/videos`,
    accessToken,
    "POST",
    params,
    config
  );
}

/**
 * Publish a text-only post to Facebook page feed
 */
export async function publishFacebookFeed(
  pageId: string,
  accessToken: string,
  caption: string,
  config?: MetaClientConfig
): Promise<{ id: string }> {
  return makeGraphRequest<{ id: string }>(
    `${pageId}/feed`,
    accessToken,
    "POST",
    { message: caption },
    config
  );
}

/**
 * Create media container for Instagram (photo or video)
 */
export async function createInstagramMediaContainer(
  igUserId: string,
  accessToken: string,
  mediaUrl: string,
  mediaType: "IMAGE" | "VIDEO",
  caption?: string,
  config?: MetaClientConfig
): Promise<{ id: string }> {
  const params: Record<string, unknown> = {
    image_url: mediaType === "IMAGE" ? mediaUrl : undefined,
    video_url: mediaType === "VIDEO" ? mediaUrl : undefined,
    media_type: mediaType,
  };

  if (caption) {
    params.caption = caption;
  }

  // Remove undefined values
  Object.keys(params).forEach((key) =>
    params[key] === undefined && delete params[key]
  );

  return makeGraphRequest<{ id: string }>(
    `${igUserId}/media`,
    accessToken,
    "POST",
    params,
    config
  );
}

/**
 * Publish an Instagram media container
 */
export async function publishInstagramContainer(
  igUserId: string,
  accessToken: string,
  containerId: string,
  config?: MetaClientConfig
): Promise<{ id: string }> {
  return makeGraphRequest<{ id: string }>(
    `${igUserId}/media_publish`,
    accessToken,
    "POST",
    { creation_id: containerId },
    config
  );
}
