# Meta API Posting Guide: Image & Carousel Workflows

This document outlines the technical requirements and API orchestration needed to post single and multiple images to Facebook and Instagram.

---

## 1. Facebook Image Posting

### A. Single Photo Upload (Local Storage)
To post from local storage, use a `multipart/form-data` request. This allows you to send the raw binary data without external hosting.

- **Endpoint:** `POST /v20.0/{page-id}/photos`
- **Parameters:**
    - `source`: The binary file (image).
    - `message`: (Optional) The caption for the post.
    - `published`: Set to `true` (default) to post immediately.
- **Documentation:** [Facebook Page Photos Reference](https://developers.facebook.com/docs/graph-api/reference/page/photos/)

### B. Multiple Photo Post (Multi-Photo Story)
Facebook requires a "Stage and Commit" workflow for multiple photos.

1.  **Stage Images:** For each image, call `POST /{page-id}/photos` with `published=false`. Store the returned `id` (fbid).
2.  **Commit Post:** Create the feed post using the attached IDs.
    - **Endpoint:** `POST /v20.0/{page-id}/feed`
    - **Parameters:**
        - `message`: The main caption.
        - `attached_media`: An array of JSON objects: `[{"media_fbid": "123"}, {"media_fbid": "456"}]`.
- **Documentation:** [Facebook Feed Reference (attached_media)](https://developers.facebook.com/docs/graph-api/reference/v20.0/page/feed#publish)

---

## 2. Instagram Image Posting

**Note:** Instagram **cannot** pull directly from local storage. Files must be hosted on a public-facing URL (e.g., S3, Cloudinary).

### A. Single Image Workflow
1.  **Create Container:** - **Endpoint:** `POST /v20.0/{ig-user-id}/media`
    - **Parameters:** `image_url`, `caption`.
    - **Returns:** A `creation_id`.
2.  **Verify Status:** (Optional but recommended) Check `GET /{creation_id}?fields=status_code`.
3.  **Publish:**
    - **Endpoint:** `POST /v20.0/{ig-user-id}/media_publish`
    - **Parameters:** `creation_id`.
- **Documentation:** [IG User Media Reference](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media)

### B. Carousel (Multiple Images/Videos)
1.  **Create Item Containers:** Create up to 10 child containers.
    - **Endpoint:** `POST /v20.0/{ig-user-id}/media`
    - **Parameters:** `image_url`, `is_carousel_item=true`.
2.  **Create Carousel Container:** - **Endpoint:** `POST /v20.0/{ig-user-id}/media`
    - **Parameters:** - `media_type=CAROUSEL`
        - `children`: A comma-separated list of child `creation_id`s.
        - `caption`: The caption for the entire carousel.
3.  **Publish:** Use the `media_publish` endpoint with the ID from Step 2.
- **Documentation:** [Instagram Carousel Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing#carousel-posts)

---

## 3. Implementation Strategy for Agents

### Storage Bridge
Because Instagram requires a URL, the agent should implement a `StorageService`:
- Upload local file to a temporary S3/Cloud storage.
- Pass the resulting URL to the Instagram logic.
- (Optional) Use the same URL for Facebook via the `url` parameter to keep code unified, or use the `source` parameter for direct Facebook uploads.

### Polling Logic
For Instagram, the agent must implement a retry/polling mechanism to ensure the `creation_id` is "FINISHED" before calling the publish endpoint.