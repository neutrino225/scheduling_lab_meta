/**
 * Meta Graph API shared types and interfaces
 */

/**
 * Normalized response from Meta Graph API calls
 */
export interface MetaGraphResponse<T = unknown> {
  id?: string;
  [key: string]: unknown;
}

/**
 * Result of a successful post publish to Meta platform
 */
export interface PublishResult {
  platformPostId: string;
  platform: "facebook" | "instagram";
  publishedAt: number;
  raw?: unknown;
}

/**
 * Detailed error information from Meta API
 */
export interface MetaApiError extends Error {
  code?: string;
  statusCode?: number;
  isTokenError: boolean;
  isRateLimit: boolean;
  retryable: boolean;
  message: string;
  raw?: unknown;
}

/**
 * Context for posting to Meta platforms
 */
export interface PublishContext {
  accountId: string;
  postId: string;
  platform: "facebook" | "instagram";
  caption?: string;
  mediaUrls?: string[];
  pageId?: string;
  igUserId?: string;
  accessToken: string;
}

/**
 * Facebook-specific publish payload
 */
export interface FacebookPublishPayload {
  pageId: string;
  accessToken: string;
  caption?: string;
  photoUrl?: string;
  videoUrl?: string;
}

/**
 * Instagram-specific publish payload
 */
export interface InstagramPublishPayload {
  igUserId: string;
  accessToken: string;
  caption?: string;
  imageUrl?: string;
  videoUrl?: string;
  isCarousel?: boolean;
}

/**
 * Graph API error response structure
 */
export interface GraphApiErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}
