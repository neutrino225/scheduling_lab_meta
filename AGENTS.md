# Meta Lab — Agent Context

## Project Overview

Meta Lab is a self-hosted social media scheduling system for Facebook Pages and Instagram Business accounts.

It allows a single operator to:
- Create posts with images/videos/carousels
- Schedule posts at exact timestamps
- Publish to multiple Meta accounts (Pages + IG business accounts)
- Manage media via MinIO
- Handle automated posting via a local worker system

This is NOT a SaaS system. It is a single-tenant internal tool.

---

## Tech Stack

### Runtime
- Bun (primary runtime for app)
- Node.js (for worker via tsx/ts-node - Bun lacks better-sqlite3 native binding support)

### Frontend / Backend
- Next.js 16.2.3 (App Router)
- TypeScript

### Database
- SQLite (primary)
- Drizzle ORM 0.45.2
- better-sqlite3 (for Next.js app)

### Storage
- MinIO (S3-compatible object storage) - optional for local dev

### Meta API Integration
- Graph API v20.0 (default, configurable)
- Custom wrapper (`lib/meta/`) for Facebook & Instagram
- Dry-run mode for safe testing

### Scheduling System
- Custom DB-backed job queue (NO Redis)
- Worker process (Node.js script polling DB every 3s default)
- Atomic job locking (30s timeout) prevents duplicate execution

### Reverse Proxy
- Nginx (for domain routing)

---

## Deployment Model

The system runs as 3 processes:

1. Next.js App (UI + API)
2. Worker Process (job executor)
3. SQLite DB file (local persistent storage)

All deployed on a single Ubuntu server using Podman.

---

## Domain Structure

The system is hosted on a subdomain:

- `poster.<domain>` OR `metalab.<domain>`

Nginx proxies traffic to:
- `localhost:3000` (Next.js app)

---

## Core Features

### 1. Post Creation
- Caption input
- Media upload (image/video)
- Platform selection (Facebook / Instagram)
- Account selection
- Scheduled timestamp

### 2. Scheduling System
- Posts are converted into "jobs"
- Jobs are stored in SQLite
- Worker polls DB every few seconds
- Jobs execute exactly at or after scheduled time

### 3. Media Handling
- All media stored in MinIO
- Media URLs are stored in DB
- Worker generates signed URLs when needed for Meta API

---

## Database Schema (Drizzle ORM)

### accounts
- id (text, PK)
- platform (facebook | instagram)
- name (text)
- pageId (text)
- igUserId (text)
- accessToken (text)
- tokenExpiresAt (int)

---

### posts
- id (text, PK)
- accountId (text)
- caption (text)
- platform (text)
- status (draft | scheduled | processing | published | failed)
- scheduledAt (int timestamp)
- publishedAt (int timestamp)
- createdAt (int timestamp)
- error (text)

---

### media
- id (text, PK)
- postId (text)
- url (text) → MinIO path
- type (image | video)
- orderIndex (int)

---

### jobs
- id (text, PK)
- postId (text)
- runAt (int timestamp)
- status (pending | running | done | failed)
- attempts (int)
- lockedAt (int timestamp)
- lastError (text)

---

## Job Processing Model

### Worker Behavior

The worker is a continuous loop:

1. Query DB for due jobs:
   - status = 'pending'
   - runAt <= now
   - not locked OR lock expired

2. Lock job:
   - set status = 'running'
   - set lockedAt = now

3. Execute job:
   - fetch post + media
   - call Meta Graph API
   - upload media if required
   - publish post

4. Update status:
   - success → done + publishedAt
   - failure → retry logic

---

### Retry Policy

- Max attempts: 3
- Backoff:
  - 1st retry: +2 min
  - 2nd retry: +5 min
  - 3rd retry: fail permanently

---

## Meta API Implementation

### Graph API Client (`lib/meta/client.ts`)
- Base URL: configurable via `META_GRAPH_BASE_URL` (default: https://graph.facebook.com)
- API Version: configurable via `META_GRAPH_VERSION` (default: v20.0)
- Timeout: configurable via `META_GRAPH_TIMEOUT` (default: 30000ms)
- **Dry-run mode**: `META_DRY_RUN=true` returns mock responses without real API calls
- Error handling:
  - Token errors detected (code 190, OAuthException)
  - Rate limits detected (code 429, 4)
  - Retryability flags set automatically

### Facebook Publisher (`lib/meta/facebook.ts`)
- Text-only posts: `POST /{pageId}/feed`
- Photo posts: `POST /{pageId}/photos`
- Video posts: `POST /{pageId}/videos`
- Supports caption on all types
- Returns: `{ platformPostId, publishedAt, raw }`

### Instagram Publisher (`lib/meta/instagram.ts`)
- Two-step publishing:
  1. Create media container: `POST /{igUserId}/media`
  2. Publish container: `POST /{igUserId}/media_publish`
- Supports single photo or video (carousel support: future)
- **Enforces media requirement** (validation + runtime check)
- Returns: `{ platformPostId, publishedAt, raw }`

---

## Meta API Rules

### Instagram
- Requires Business or Creator account
- **Mandatory media requirement**: at least 1 image or video
- Posting flow (implemented):
  1. Create media container with image/video URL
  2. Publish container to media feed
- Supported media types: image, video
- Future: carousel support

### Facebook Pages
- Direct post via Graph API endpoints:
  - `/page-id/feed` (text-only)
  - `/page-id/photos` (single photo with caption)
  - `/page-id/videos` (single video with title/description)
- No media requirement (text-only supported)
- Returns platform post ID on success

### Requirements
- Valid access token (manual setup, no refresh)
- Tokens stored in `accounts.accessToken`
- pageId required for Facebook accounts
- igUserId required for Instagram accounts
- Token errors trigger failure (retried with backoff)

---

## Media Requirements

- Instagram requires:
  - public image/video URL
  - correct aspect ratios
- Worker must ensure:
  - MinIO signed URLs are valid at execution time

---

## MinIO Integration

### Storage Modes

The system supports two storage modes via `MINIO_STORAGE_MODE` environment variable:

#### Local Mode (Development)
- `MINIO_STORAGE_MODE=local` (default)
- Files stored in `./storage/media/` directory
- No external service required
- Perfect for local development and testing
- Files served via `GET /api/media/serve/{storageKey}`

#### MinIO Mode (Production)
- `MINIO_STORAGE_MODE=minio`
- Files uploaded to remote MinIO server (or S3-compatible)
- Requires MinIO connection env variables
- Presigned URLs generated for all files
- Automatic bucket creation on startup

### API Endpoints

#### POST /api/media/upload
Upload media and create media record
- Accepts: `multipart/form-data` with file, postId, type
- Validation:
  - File size: max 100MB
  - Allowed types: image (jpeg, png, gif, webp), video (mp4, mov, avi)
  - postId must be valid
  - type must be "image" or "video"
- Response: `{ success, media: { id, url, storageKey, publicUrl } }`
- Returns presigned URL (local mode: `/api/media/serve/{key}`, MinIO mode: S3 signed URL)

#### GET /api/media/serve/[...storageKey]
Serve media files (local mode only)
- Only available when `MINIO_STORAGE_MODE=local`
- Prevents directory traversal attacks
- Returns proper Content-Type headers
- 1-year cache control

### Environment Variables

```env
# Storage mode selection
MINIO_STORAGE_MODE=local  # or 'minio'

# MinIO-specific (only required if MINIO_STORAGE_MODE=minio)
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_REGION=us-east-1
MINIO_BUCKET=media
```

### Storage Key Format

- Pattern: `posts/{timestamp}-{random9chars}.{ext}`
- Example: `posts/1712345678901-abc123def.jpg`
- Prevents collisions and allows easy expiry cleanup

### Worker Integration

When worker publishes posts:
1. Fetch media records (contains storage keys)
2. Call `getSignedUrl(storageKey)` for each media item
3. Pass signed URLs to Meta Graph API
4. Facebook/Instagram handles validation

---

## Concurrency Rules

- Multiple jobs may execute at same timestamp
- Worker must support safe concurrency using DB locking
- Never process same job twice

---

## System Constraints

- Single user system (no multi-tenancy required)
- Low scale (~10 posts/day)
- No Redis or external queue system
- Must be resilient to worker restarts

---

## Code Guidelines

### Required Principles
- Keep logic server-side (API routes only orchestrate)
- Worker handles ALL publishing logic
- DB is source of truth for scheduling
- Avoid in-memory state for jobs

### Preferred Patterns
- Functional modules
- Small isolated utilities:
  - meta/
  - minio/
  - scheduler/
  - db/

---

## Folder Structure

meta-lab/
  app/
    api/
      test-db/route.ts           ← Dev-only seeding
      posts/route.ts             ← POST /api/posts
      posts/list/route.ts        ← GET /api/posts/list (filtered)
      posts/[id]/route.ts        ← GET /api/posts/[id]
      accounts/route.ts          ← GET /api/accounts
      jobs/route.ts              ← GET /api/jobs
      media/upload/route.ts      ← POST /api/media/upload (multipart upload)
      media/serve/[...storageKey]/route.ts ← GET /api/media/serve/{key} (local mode)
    layout.tsx
    page.tsx
  lib/
    db/
      index.ts                   ← Drizzle setup (better-sqlite3)
    api/
      errors.ts                  ← Standard error/success responses
      validation.ts              ← Request validation helpers
    meta/
      types.ts                   ← Shared types (PublishResult, MetaApiError)
      client.ts                  ← Graph API client utility
      facebook.ts                ← Facebook publisher
      instagram.ts               ← Instagram publisher
    minio/
      client.ts                  ← MinIO client (local or remote storage)
    accounts/
      service.ts                 ← Account queries
    posts/
      service.ts                 ← Post CRUD (with auto job creation + media adding)
    jobs/
      service.ts                 ← Job queries & processing
  worker/
    index.ts                     ← Polling loop (runs in Node.js)
    processor.ts                 ← Job execution & retry logic
  drizzle/
    schema.ts                    ← All 4 table definitions
    migrations/
      0000_empty_angel.sql       ← Initial schema
      0001_brown_captain_cross.sql ← Applied constraints, defaults
  db.sqlite                      ← Database file (persistent)
  .env.local                     ← Environment variables
  drizzle.config.ts              ← Drizzle configuration
  package.json                   ← Dependencies

---

## Worker Execution Model

Worker runs independently in Node.js (not Bun due to better-sqlite3 compatibility):

```bash
npx tsx worker/index.ts
```

Configuration via environment:
- `WORKER_POLL_INTERVAL`: milliseconds between job polls (default: 3000)
- `WORKER_MAX_CONCURRENT`: max jobs per cycle (default: 3)
- `META_DRY_RUN`: set to true for testing without real API calls

Worker behavior:
- Runs infinite loop polling DB every 3–5 seconds
- Fetches pending jobs with `runAt <= now` and no active lock
- Processes in batches (default 3 concurrent)
- Atomic locking prevents duplicate execution
- Graceful shutdown on SIGTERM/SIGINT

Job states:
- `pending` → `running` (while locked) → `done` or `failed`
- On failure: applies retry backoff, reschedules if attempts < 3
- On success: updates `posts.status = published` and sets `publishedAt`

---

## Failure Handling

If a job fails:
- store error in jobs.lastError and posts.error
- increment attempts
- reschedule with backoff if under retry limit:
  - After attempt 1: +2 minutes
  - After attempt 2: +5 minutes
  - After attempt 3: mark as permanently failed
- otherwise mark failed and keep error for debugging

---

## Environment Variables

```
# Core
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000

# Meta Graph API Configuration
META_GRAPH_BASE_URL=https://graph.facebook.com
META_GRAPH_VERSION=v20.0
META_GRAPH_TIMEOUT=30000

# Dry-run mode: set to true to test worker flow without real Meta API calls
# When enabled, posts will be marked as published with mock IDs
META_DRY_RUN=true

# Worker Configuration
WORKER_POLL_INTERVAL=3000
WORKER_MAX_CONCURRENT=3
```

---

## Security Notes

- Never expose Meta access tokens in frontend
- All Meta API calls must be server-side only
- Media URLs must not leak sensitive bucket access
- Protect dashboard with authentication (future requirement)

---

## Future Enhancements (NOT REQUIRED NOW)

- Token refresh flow (currently manual long-lived tokens only)
- Post analytics dashboard
- Multi-user support
- Carousel post support (multi-media Instagram)
- Media upload from MinIO to Meta
- Webhook-based execution instead of polling
- Content calendar UI
- AI caption generator
- Multi-account batch operations

---

## IMPORTANT DESIGN TRUTH

This system is intentionally:
- simple
- file-based (SQLite)
- queue-less (no Redis)
- worker-driven

It prioritizes:
- reliability over scale
- simplicity over abstraction
- control over automation frameworks

---

## Agent Instruction Summary

When modifying this codebase:
- NEVER introduce Redis unless explicitly requested
- NEVER replace SQLite without migration plan
- ALWAYS ensure worker safety for duplicate execution
- ALWAYS treat DB as source of truth
- ALWAYS assume single-tenant system

## API Endpoints

### POST /api/posts
Create a new post (draft or scheduled)
- Validates: accountId, platform, caption (optional), scheduledAt (optional)
- Instagram posts require at least one media item
- Returns: 201 with post + media + job (if scheduled)

### GET /api/posts/list
List posts with optional filtering
- Query params: status, platform, accountId, scheduledBefore, scheduledAfter, limit, offset
- Returns: paginated array of posts

### GET /api/posts/[id]
Fetch single post with media and job
- Returns: post object with media array and job (if exists)

### GET /api/accounts
List all connected Meta accounts
- Returns: array of accounts with platform, name, pageId, igUserId

### GET /api/jobs
List jobs with optional filtering and summary mode
- Query params: status, postId, limit, offset, summary (returns counts)
- Returns: array of jobs or summary counts

### GET /api/test-db (Dev-only)
Seed test data (Facebook + Instagram accounts)
- Only available in NODE_ENV=development
- Idempotent (safe to call multiple times)
- Returns: seeded accounts and posts

## Validation Rules

### Instagram Posts
- **MUST have media** - at least 1 image or video
- Validation error returned at API level (POST /api/posts)

### Facebook Posts
- **Can be text-only** - media is optional
- Supports photos and videos when provided

### Account Requirements
- Facebook: must have pageId
- Instagram: must have igUserId
- Both: must have valid accessToken
