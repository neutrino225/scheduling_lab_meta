/**
 * Instagram Business publishing logic
 */

import {
  InstagramPublishPayload,
  PublishResult,
  MetaApiError,
} from "./types";
import {
  createInstagramMediaContainer,
  publishInstagramContainer,
  getMetaClientConfig,
} from "./client";

/**
 * Publish post to Instagram Business account
 * Supports:
 * - Single photo posts (requires image media)
 * - Single video posts (requires video media)
 * - Carousel posts not yet supported (can be added in next iteration)
 *
 * Instagram requires at least one media item
 */
export async function publishInstagramPost(
  payload: InstagramPublishPayload,
  mediaType?: "image" | "video"
): Promise<PublishResult> {
  const config = getMetaClientConfig();

  try {
    if (!payload.igUserId) {
      throw new Error("Instagram igUserId is required");
    }

    if (!payload.accessToken) {
      throw new Error("Instagram accessToken is required");
    }

    // Instagram requires media
    const hasImage = mediaType === "image" && payload.imageUrl;
    const hasVideo = mediaType === "video" && payload.videoUrl;

    if (!hasImage && !hasVideo) {
      throw new Error(
        "Instagram post requires at least one media item (image or video)"
      );
    }

    // Determine which media URL to use
    const mediaUrl = hasImage ? payload.imageUrl! : payload.videoUrl!;
    const apiMediaType = hasImage ? "IMAGE" : "VIDEO";

    // Step 1: Create media container
    const containerResponse = await createInstagramMediaContainer(
      payload.igUserId,
      payload.accessToken,
      mediaUrl,
      apiMediaType,
      payload.caption,
      config
    );

    // Step 2: Publish container
    const publishResponse = await publishInstagramContainer(
      payload.igUserId,
      payload.accessToken,
      containerResponse.id,
      config
    );

    return {
      platformPostId: publishResponse.id,
      platform: "instagram",
      publishedAt: Date.now(),
      raw: {
        containerId: containerResponse.id,
        mediaId: publishResponse.id,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      const metaError = new Error(
        `Instagram publish failed: ${error.message}`
      ) as Error & Partial<MetaApiError>;
      metaError.cause = error;
      throw metaError;
    }
    throw error;
  }
}
