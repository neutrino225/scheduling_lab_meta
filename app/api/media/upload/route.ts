import { NextRequest, NextResponse } from "next/server";
import { uploadToStorage } from "@/lib/minio/client";
import { createMedia } from "@/lib/posts/service";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
];

/**
 * POST /api/media/upload
 * Upload media file and create media record in database
 * Requires: multipart/form-data with file, postId, type
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract fields
    const file = formData.get("file") as File;
    const postId = formData.get("postId") as string;
    const mediaType = formData.get("type") as string; // "image" or "video"

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!mediaType || !["image", "video"].includes(mediaType)) {
      return NextResponse.json(
        { error: "type must be 'image' or 'video'" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to storage
    const { storageKey, url } = await uploadToStorage({
      fileName: file.name,
      fileBuffer,
      contentType: file.type,
    });

    // If postId provided, create media record in database
    let mediaRecord = null;
    if (postId) {
      mediaRecord = await createMedia({
        postId,
        url: storageKey,
        type: mediaType as "image" | "video",
      });
    }

    return NextResponse.json(
      {
        success: true,
        key: storageKey,
        publicUrl: url,
        media: mediaRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
