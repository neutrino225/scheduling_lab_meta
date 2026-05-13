export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  code?: string;
  message?: string;
}

export interface Account {
  id: string;
  platform: "facebook" | "instagram";
  name: string;
  pageId: string | null;
  igUserId: string | null;
  accessToken: string | null;
  tokenExpiresAt: number | null;
  profilePictureUrl?: string;
}

export interface Post {
  id: string;
  accountId: string;
  caption: string | null;
  platform: "facebook" | "instagram";
  status: "draft" | "scheduled" | "processing" | "published" | "failed";
  scheduledAt: number | null;
  publishedAt: number | null;
  createdAt: number;
  error: string | null;
}

export interface Job {
  id: string;
  postId: string;
  runAt: number;
  status: "pending" | "running" | "done" | "failed";
  attempts: number;
  lockedAt: number | null;
  lastError: string | null;
}

export interface JobSummary {
  pending: number;
  running: number;
  done: number;
  failed: number;
}
