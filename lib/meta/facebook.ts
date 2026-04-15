/**
 * Facebook Page publishing logic
 */

import {
  FacebookPublishPayload,
  PublishResult,
  MetaApiError,
} from "./types";
import {
  publishFacebookPhoto,
  publishFacebookVideo,
  publishFacebookFeed,
  getMetaClientConfig,
} from "./client";

/**
 * Publish post to Facebook Page
 * Supports:
 * - Text-only posts to feed
 * - Single photo posts
 * - Single video posts
 */
export async function publishFacebookPost(
  payload: FacebookPublishPayload,
  mediaType?: "image" | "video"
): Promise<PublishResult> {
  const config = getMetaClientConfig();

  try {
    if (!payload.pageId) {
      throw new Error("Facebook pageId is required");
    }

    if (!payload.accessToken) {
      throw new Error("Facebook accessToken is required");
    }

    let publishResponse: { id: string };

    // Determine what to publish based on media
    if (mediaType === "video" && payload.videoUrl) {
      // Publish video
      publishResponse = await publishFacebookVideo(
        payload.pageId,
        payload.accessToken,
        payload.videoUrl,
        payload.caption,
        config
      );
    } else if (mediaType === "image" && payload.photoUrl) {
      // Publish photo
      publishResponse = await publishFacebookPhoto(
        payload.pageId,
        payload.accessToken,
        payload.photoUrl,
        payload.caption,
        config
      );
    } else if (payload.caption) {
      // Text-only post
      publishResponse = await publishFacebookFeed(
        payload.pageId,
        payload.accessToken,
        payload.caption,
        config
      );
    } else {
      throw new Error("No content to publish: provide caption or media");
    }

    return {
      platformPostId: publishResponse.id,
      platform: "facebook",
      publishedAt: Date.now(),
      raw: publishResponse,
    };
  } catch (error) {
    if (error instanceof Error) {
      const metaError = new Error(
        `Facebook publish failed: ${error.message}`
      ) as Error & Partial<MetaApiError>;
      metaError.cause = error;
      throw metaError;
    }
    throw error;
  }
}
