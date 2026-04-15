import * as fs from "fs";
import * as path from "path";

/**
 * MinIO Client Configuration
 * Supports both remote MinIO server and local file storage (dev mode)
 */

interface MinIOConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  region: string;
  bucket: string;
}

interface UploadOptions {
  fileName: string;
  fileBuffer: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

interface SignedUrlOptions {
  expiry?: number; // seconds, default 7 days
}

/**
 * MinIO storage mode: 'minio' or 'local'
 * local: stores in ./storage/media (useful for development)
 * minio: connects to remote MinIO server
 */
const STORAGE_MODE = process.env.MINIO_STORAGE_MODE || "local";

/**
 * Parse MinIO configuration from environment
 */
function getConfig(): MinIOConfig {
  return {
    endpoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    region: process.env.MINIO_REGION || "us-east-1",
    bucket: process.env.MINIO_BUCKET || "media",
  };
}

/**
 * Generate a unique storage key for the file
 */
export function generateStorageKey(fileName: string): string {
  const timestamp = Date.now();
  const ext = path.extname(fileName);
  return `posts/${timestamp}-${Math.random().toString(36).substr(2, 9)}${ext}`;
}

/**
 * Upload file to MinIO (or local storage in dev mode)
 */
export async function uploadToStorage(
  options: UploadOptions
): Promise<{ storageKey: string; url: string }> {
  if (STORAGE_MODE === "local") {
    return uploadToLocal(options);
  } else {
    return uploadToMinIO(options);
  }
}

/**
 * Get signed URL for file (with expiry)
 * Returns a URL that can be used to fetch the file
 */
export async function getSignedUrl(
  storageKey: string,
  options: SignedUrlOptions = {}
): Promise<string> {
  if (STORAGE_MODE === "local") {
    return getLocalUrl(storageKey);
  } else {
    return getMinIOSignedUrl(storageKey, options);
  }
}

/**
 * Delete file from storage
 */
export async function deleteFromStorage(storageKey: string): Promise<void> {
  if (STORAGE_MODE === "local") {
    deleteFromLocal(storageKey);
  } else {
    deleteFromMinIO(storageKey);
  }
}

/**
 * ==================== LOCAL STORAGE (Development) ====================
 */

const LOCAL_STORAGE_DIR = path.join(process.cwd(), "storage", "media");

function ensureLocalStorageDir(): void {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
}

async function uploadToLocal(
  options: UploadOptions
): Promise<{ storageKey: string; url: string }> {
  ensureLocalStorageDir();

  const storageKey = generateStorageKey(options.fileName);
  const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);

  // Ensure subdirectories exist
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(filePath, options.fileBuffer);

  const url = `/api/media/serve/${storageKey}`;
  return { storageKey, url };
}

function getLocalUrl(storageKey: string): string {
  return `/api/media/serve/${storageKey}`;
}

function deleteFromLocal(storageKey: string): void {
  const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getLocalStoragePath(storageKey: string): string {
  return path.join(LOCAL_STORAGE_DIR, storageKey);
}

/**
 * ==================== MINIO STORAGE (Production) ====================
 */

let minioClient: any = null;

async function initMinIOClient(): Promise<any> {
  if (minioClient) {
    return minioClient;
  }

  try {
    const { Client } = await import("minio");
    const config = getConfig();

    minioClient = new Client({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });

    // Test connection
    await minioClient.bucketExists(config.bucket);

    return minioClient;
  } catch (error) {
    console.error("Failed to initialize MinIO client:", error);
    throw new Error("MinIO client initialization failed");
  }
}

async function uploadToMinIO(
  options: UploadOptions
): Promise<{ storageKey: string; url: string }> {
  const client = await initMinIOClient();
  const config = getConfig();
  const storageKey = generateStorageKey(options.fileName);

  try {
    await client.putObject(
      config.bucket,
      storageKey,
      options.fileBuffer,
      options.fileBuffer.length,
      {
        "Content-Type": options.contentType,
        ...options.metadata,
      }
    );

    // Generate presigned URL
    const url = await client.presignedGetObject(
      config.bucket,
      storageKey,
      7 * 24 * 60 * 60 // 7 days default
    );

    return { storageKey, url };
  } catch (error) {
    console.error("MinIO upload failed:", error);
    throw new Error("File upload to MinIO failed");
  }
}

async function getMinIOSignedUrl(
  storageKey: string,
  options: SignedUrlOptions
): Promise<string> {
  const client = await initMinIOClient();
  const config = getConfig();
  const expiry = options.expiry || 7 * 24 * 60 * 60; // 7 days default

  try {
    const url = await client.presignedGetObject(
      config.bucket,
      storageKey,
      expiry
    );
    return url;
  } catch (error) {
    console.error("Failed to generate MinIO signed URL:", error);
    throw new Error("Failed to generate signed URL");
  }
}

async function deleteFromMinIO(storageKey: string): Promise<void> {
  const client = await initMinIOClient();
  const config = getConfig();

  try {
    await client.removeObject(config.bucket, storageKey);
  } catch (error) {
    console.error("MinIO delete failed:", error);
    throw new Error("Failed to delete file from MinIO");
  }
}

/**
 * Ensure MinIO bucket exists (called on startup or during setup)
 */
export async function ensureMinIOBucket(): Promise<void> {
  if (STORAGE_MODE === "local") {
    ensureLocalStorageDir();
    return;
  }

  const client = await initMinIOClient();
  const config = getConfig();

  try {
    const exists = await client.bucketExists(config.bucket);
    if (!exists) {
      await client.makeBucket(config.bucket, config.region);
      console.log(`Created MinIO bucket: ${config.bucket}`);
    }
  } catch (error) {
    console.error("Failed to ensure MinIO bucket:", error);
    throw new Error("MinIO bucket initialization failed");
  }
}

export function getStorageMode(): string {
  return STORAGE_MODE;
}
