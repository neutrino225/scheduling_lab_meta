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
  profilePictureUrl?: string | null;
  category?: string | null;
  followersCount?: number | null;
  igUsername?: string | null;
  igProfilePictureUrl?: string | null;
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
  post?: {
    caption: string | null;
    platform: "facebook" | "instagram";
  };
  account?: {
    name: string;
  };
}

export interface JobSummary {
  pending: number;
  running: number;
  done: number;
  failed: number;
}

export interface MediaItem {
  id: string;
  postId: string;
  url: string;
  type: "image" | "video";
  orderIndex: number;
}

export interface PostWithDetails extends Post {
  media: MediaItem[];
  account: {
    id: string;
    name: string;
    platform: string;
    pageId: string | null;
    igUserId: string | null;
    profilePictureUrl?: string | null;
    category?: string | null;
    followersCount?: number | null;
    igUsername?: string | null;
  } | null;
}
