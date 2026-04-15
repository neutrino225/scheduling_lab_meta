import { NextRequest, NextResponse } from "next/server";
import { getLocalStoragePath, getStorageMode } from "@/lib/minio/client";
import * as fs from "fs";

/**
 * GET /api/media/serve/[...storageKey]
 * Serve media files from local storage (development mode only)
 * In production with MinIO, this endpoint is not needed - we use presigned URLs directly
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storageKey: string[] }> }
) {
  try {
    // Only allow in local storage mode
    if (getStorageMode() !== "local") {
      return NextResponse.json(
        { error: "This endpoint is only available in local storage mode" },
        { status: 403 }
      );
    }

    const { storageKey: keyParts } = await params;
    const storageKey = keyParts.join("/");

    // Prevent directory traversal attacks
    if (storageKey.includes("..")) {
      return NextResponse.json(
        { error: "Invalid storage key" },
        { status: 400 }
      );
    }

    const filePath = getLocalStoragePath(storageKey);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Determine content type
    let contentType = "application/octet-stream";
    if (storageKey.endsWith(".jpg") || storageKey.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (storageKey.endsWith(".png")) {
      contentType = "image/png";
    } else if (storageKey.endsWith(".gif")) {
      contentType = "image/gif";
    } else if (storageKey.endsWith(".webp")) {
      contentType = "image/webp";
    } else if (storageKey.endsWith(".mp4")) {
      contentType = "video/mp4";
    } else if (storageKey.endsWith(".mov")) {
      contentType = "video/quicktime";
    } else if (storageKey.endsWith(".avi")) {
      contentType = "video/x-msvideo";
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000", // 1 year
      },
    });
  } catch (error) {
    console.error("Media serve error:", error);
    return NextResponse.json(
      { error: "Failed to serve media" },
      { status: 500 }
    );
  }
}
