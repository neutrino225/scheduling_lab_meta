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
- Bun (primary runtime for app + worker)

### Frontend / Backend
- Next.js (App Router)
- TypeScript

### Database
- SQLite (primary)
- Drizzle ORM

### Storage
- MinIO (S3-compatible object storage)

### Scheduling System
- Custom DB-backed job queue (NO Redis)
- Worker process (Bun script polling DB)

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

## Meta API Rules

### Instagram
- Requires Business or Creator account
- Posting flow:
  1. Create media container
  2. Publish container

### Facebook Pages
- Direct post via Graph API:
  - /page-id/feed
  - /page-id/photos

### Requirements
- Valid access token required
- Tokens must be long-lived
- Must handle expiration gracefully

---

## Media Requirements

- Instagram requires:
  - public image/video URL
  - correct aspect ratios
- Worker must ensure:
  - MinIO signed URLs are valid at execution time

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
    dashboard/
  lib/
    db/
    meta/
    minio/
  drizzle/
    schema.ts
    migrations/
  worker/
    index.ts
    processor.ts
  db.sqlite

---

## Worker Execution Model

Worker runs independently:

bun worker/index.ts

Must:
- run infinite loop
- poll DB every 2–5 seconds
- process jobs sequentially or in small concurrency batches

---

## Failure Handling

If a job fails:
- store error in jobs.lastError
- increment attempts
- reschedule if under retry limit
- otherwise mark failed

---

## Security Notes

- Never expose Meta access tokens in frontend
- All Meta API calls must be server-side only
- Media URLs must not leak sensitive bucket access
- Protect dashboard with authentication (future requirement)

---

## Future Enhancements (NOT REQUIRED NOW)

- Post analytics dashboard
- Multi-user support
- Redis queue upgrade
- Webhook-based execution
- Content calendar UI
- AI caption generator

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
