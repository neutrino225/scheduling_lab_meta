# Meta Lab Local Testing Guide
## Complete Step-by-Step Setup for Development & Testing

---

## Prerequisites Check

Before starting, ensure you have:
- **Node.js/Bun**: `bun --version` (16+ LTS recommended)
- **Git**: `git --version`
- **Docker**: (optional but recommended for MinIO)
- **curl or Postman**: For API testing
- **SQLite CLI**: (optional, for DB inspection)

---

## Phase 1: Environment Setup

### Step 1.1: Clone & Install Dependencies

```bash
cd /path/to/meta-lab
bun install
```

**Verify**:
```bash
bun --version
ls node_modules | head -5  # Should have drizzle-orm, next, etc.
```

---

### Step 1.2: Create `.env.local` File

**Location**: `/home/neutrino/projects/meta-lab/.env.local`

```env
# Database
DATABASE_URL="file:./db.sqlite"

# MinIO (local S3-compatible storage)
MINIO_ENDPOINT="127.0.0.1"
MINIO_PORT="9000"
MINIO_REGION="us-east-1"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="meta-lab-media"
MINIO_PUBLIC_URL="http://127.0.0.1:9000"

# Meta API (test credentials)
META_GRAPH_API_VERSION="v18.0"
FACEBOOK_APP_ID="your-app-id-here"
FACEBOOK_APP_SECRET="your-app-secret-here"

# Node environment
NODE_ENV="development"

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Worker process
WORKER_POLL_INTERVAL_MS="5000"
WORKER_LOCK_TIMEOUT_MS="30000"
```

**Create the file**:
```bash
cat > .env.local << 'EOF'
DATABASE_URL="file:./db.sqlite"
MINIO_ENDPOINT="127.0.0.1"
MINIO_PORT="9000"
MINIO_REGION="us-east-1"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="meta-lab-media"
MINIO_PUBLIC_URL="http://127.0.0.1:9000"
META_GRAPH_API_VERSION="v18.0"
FACEBOOK_APP_ID="your-app-id-here"
FACEBOOK_APP_SECRET="your-app-secret-here"
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000"
WORKER_POLL_INTERVAL_MS="5000"
WORKER_LOCK_TIMEOUT_MS="30000"
EOF
```

---

## Phase 2: Database Setup

### Step 2.1: Verify Database Exists

```bash
ls -lah db.sqlite
```

**If it doesn't exist, migrations will create it on first run.**

### Step 2.2: Apply Migrations

```bash
bunx drizzle-kit migrate
```

**Expected output**:
```
Reading config file '/home/neutrino/projects/meta-lab/drizzle.config.ts'
[✓] migrations applied successfully!
```

**Verify schema**:
```bash
bun -e "
import { db } from './lib/db';
const tables = await db.select().from(sql\`sqlite_master WHERE type='table'\`);
console.log(tables);
"
```

---

### Step 2.3: Create Seed Script

**File**: `/home/neutrino/projects/meta-lab/scripts/seed.ts`

```typescript
import { db } from "../lib/db";
import { accounts, posts, media, jobs } from "../drizzle/schema";
import { v4 as uuid } from "uuid";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create test account
  const accountId = uuid();
  await db.insert(accounts).values({
    id: accountId,
    platform: "facebook",
    name: "Test Facebook Page",
    pageId: "123456789",
    accessToken: "test-token-facebook-long-lived",
  });
  console.log("✅ Created test Facebook account");

  // Create another account
  const igAccountId = uuid();
  await db.insert(accounts).values({
    id: igAccountId,
    platform: "instagram",
    name: "Test Instagram Business",
    igUserId: "987654321",
    accessToken: "test-token-instagram-long-lived",
  });
  console.log("✅ Created test Instagram account");

  // Create test posts
  const now = Date.now();
  const futureTime = now + 24 * 60 * 60 * 1000; // 24 hours from now
  const pastTime = now - 2 * 60 * 60 * 1000; // 2 hours ago

  // Draft post
  const draftPostId = uuid();
  await db.insert(posts).values({
    id: draftPostId,
    accountId,
    caption: "This is a draft post - never published yet",
    platform: "facebook",
    status: "draft",
    createdAt: now,
  });
  console.log("✅ Created draft post");

  // Scheduled post
  const scheduledPostId = uuid();
  await db.insert(posts).values({
    id: scheduledPostId,
    accountId,
    caption: "This post will be published in 24 hours",
    platform: "facebook",
    status: "scheduled",
    scheduledAt: futureTime,
    createdAt: now,
  });

  // Create corresponding job
  await db.insert(jobs).values({
    id: uuid(),
    postId: scheduledPostId,
    runAt: futureTime,
    status: "pending",
    attempts: 0,
  });
  console.log("✅ Created scheduled post with job");

  // Published post
  const publishedPostId = uuid();
  await db.insert(posts).values({
    id: publishedPostId,
    accountId,
    caption: "This post was successfully published",
    platform: "facebook",
    status: "published",
    createdAt: pastTime,
    publishedAt: pastTime + 5 * 60 * 1000,
  });
  console.log("✅ Created published post");

  // Add media to published post
  await db.insert(media).values({
    id: uuid(),
    postId: publishedPostId,
    url: "https://example.com/image1.jpg",
    type: "image",
    orderIndex: 0,
  });
  console.log("✅ Added media to post");

  // Failed post
  const failedPostId = uuid();
  await db.insert(posts).values({
    id: failedPostId,
    accountId: igAccountId,
    caption: "This post failed to publish",
    platform: "instagram",
    status: "failed",
    error: "Meta API returned 403: Permission denied",
    createdAt: pastTime,
  });
  console.log("✅ Created failed post");

  console.log("🌱 Seeding complete!");
  console.log("\nTest Data Created:");
  console.log(`- Facebook Account ID: ${accountId}`);
  console.log(`- Instagram Account ID: ${igAccountId}`);
  console.log(`- Draft Post ID: ${draftPostId}`);
  console.log(`- Scheduled Post ID: ${scheduledPostId}`);
  console.log(`- Published Post ID: ${publishedPostId}`);
  console.log(`- Failed Post ID: ${failedPostId}`);
}

seed().catch(console.error);
```

**Run seed**:
```bash
bun run scripts/seed.ts
```

---

## Phase 3: Start Local Services

### Step 3.1: Start Next.js Development Server

**Terminal 1**:
```bash
bun run dev
```

**Expected output**:
```
▲ Next.js 16.2.3
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

**Test it**:
```bash
curl http://localhost:3000
```

---

### Step 3.2 (Optional): Start MinIO Locally

**Using Docker** (recommended for local testing):

```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio-local \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio:latest server /data --console-address ":9001"
```

**Verify MinIO is running**:
```bash
curl http://127.0.0.1:9000/minio/health/live
# Should return: {"status":"ok"}
```

**Access MinIO Console**: http://127.0.0.1:9001
- Username: `minioadmin`
- Password: `minioadmin`

**Create bucket** (via console or CLI):
```bash
aws s3api create-bucket \
  --bucket meta-lab-media \
  --endpoint-url http://127.0.0.1:9000 \
  --region us-east-1 \
  --access-key minioadmin \
  --secret-key minioadmin
```

---

## Phase 4: Test API Routes

### Step 4.1: Seed Test Data via Dev Endpoint

```bash
curl -X GET http://localhost:3000/api/test-db
```

**Expected response**:
```json
{
  "success": true,
  "message": "Test seed data created",
  "posts": [
    {
      "id": "uuid-1",
      "accountId": "test-account-001",
      "caption": "hello meta-lab",
      "platform": "facebook",
      "status": "draft",
      "createdAt": 1705339200000,
      ...
    }
  ]
}
```

### Step 4.2: Test GET /api/accounts

```bash
curl -X GET http://localhost:3000/api/accounts
```

**Expected response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "test-account-001",
      "platform": "facebook",
      "name": "Test account (seed)",
      "pageId": "123456789",
      "igUserId": null,
      "accessToken": "test-token-facebook-long-lived",
      "tokenExpiresAt": null
    }
  ]
}
```

### Step 4.3: Test POST /api/posts

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "test-account-001",
    "caption": "Testing post creation",
    "platform": "facebook",
    "media": [
      {
        "url": "https://example.com/image.jpg",
        "type": "image"
      }
    ]
  }'
```

**Expected response** (201):
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "new-uuid",
      "accountId": "test-account-001",
      "caption": "Testing post creation",
      "status": "draft",
      "createdAt": 1705339200000,
      ...
    },
    "media": [
      {
        "id": "media-uuid",
        "postId": "new-uuid",
        "url": "https://example.com/image.jpg",
        "type": "image",
        "orderIndex": 0
      }
    ],
    "job": null
  }
}
```

### Step 4.4: Test GET /api/posts/list

```bash
curl -X GET "http://localhost:3000/api/posts/list?status=draft,scheduled&limit=10"
```

### Step 4.5: Test GET /api/posts/[id]

```bash
# Replace UUID with actual post ID
curl -X GET http://localhost:3000/api/posts/<post-id>
```

### Step 4.6: Test GET /api/jobs

```bash
curl -X GET "http://localhost:3000/api/jobs?summary=true"
```

**Expected response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "pending": 2,
      "running": 0,
      "done": 1,
      "failed": 0
    }
  }
}
```

---

## Phase 5: Worker Process Testing

### Step 5.1: Create Worker Script

**File**: `/home/neutrino/projects/meta-lab/worker/index.ts`

(Create this if not already done)

```typescript
import { db } from "../lib/db";
import { jobs, posts } from "../drizzle/schema";
import { eq, lte, and } from "drizzle-orm";

const POLL_INTERVAL = parseInt(process.env.WORKER_POLL_INTERVAL_MS || "5000", 10);
const LOCK_TIMEOUT = parseInt(process.env.WORKER_LOCK_TIMEOUT_MS || "30000", 10);

async function processPendingJobs() {
  const now = Date.now();
  console.log(`[${new Date().toISOString()}] Checking for pending jobs...`);

  try {
    // Get due jobs
    const dueJobs = await db
      .select()
      .from(jobs)
      .where(and(
        eq(jobs.status, "pending"),
        lte(jobs.runAt, now)
      ));

    console.log(`Found ${dueJobs.length} due job(s)`);

    for (const job of dueJobs) {
      try {
        // Lock job
        await db
          .update(jobs)
          .set({ status: "running", lockedAt: now })
          .where(eq(jobs.id, job.id));

        console.log(`[Job ${job.id}] Locked and processing...`);

        // Get post
        const postResult = await db
          .select()
          .from(posts)
          .where(eq(posts.id, job.postId));

        if (!postResult.length) {
          throw new Error(`Post not found: ${job.postId}`);
        }

        const post = postResult[0];

        // Mock Meta API call
        console.log(`[Job ${job.id}] Publishing to ${post.platform}...`);
        await new Promise(r => setTimeout(r, 1000)); // Simulate API call

        // Mark as done
        await db
          .update(jobs)
          .set({ status: "done" })
          .where(eq(jobs.id, job.id));

        await db
          .update(posts)
          .set({ status: "published", publishedAt: Date.now() })
          .where(eq(posts.id, post.id));

        console.log(`✅ [Job ${job.id}] Successfully published`);
      } catch (error) {
        console.error(`❌ [Job ${job.id}] Error:`, error);

        // Update with error
        const attempts = (job.attempts || 0) + 1;
        const maxAttempts = 3;

        if (attempts < maxAttempts) {
          const backoffMs = attempts === 1 ? 2 * 60 * 1000 : 5 * 60 * 1000;
          await db
            .update(jobs)
            .set({
              status: "pending",
              attempts,
              lockedAt: null,
              lastError: String(error),
              runAt: now + backoffMs,
            })
            .where(eq(jobs.id, job.id));

          console.log(`[Job ${job.id}] Rescheduled for retry (attempt ${attempts}/${maxAttempts})`);
        } else {
          await db
            .update(jobs)
            .set({
              status: "failed",
              attempts,
              lockedAt: null,
              lastError: String(error),
            })
            .where(eq(jobs.id, job.id));

          await db
            .update(posts)
            .set({ status: "failed", error: String(error) })
            .where(eq(posts.id, job.postId));

          console.log(`[Job ${job.id}] Failed permanently after ${maxAttempts} attempts`);
        }
      }
    }
  } catch (error) {
    console.error("Fatal error in worker:", error);
  }
}

async function run() {
  console.log("🚀 Meta Lab Worker started");
  console.log(`Poll interval: ${POLL_INTERVAL}ms`);
  console.log(`Lock timeout: ${LOCK_TIMEOUT}ms`);

  setInterval(processPendingJobs, POLL_INTERVAL);
  
  // Run immediately on start
  processPendingJobs();
}

run();
```

### Step 5.2: Run Worker Process

**Terminal 2** (separate from Next.js):

```bash
bun run worker/index.ts
```

**Expected output**:
```
🚀 Meta Lab Worker started
Poll interval: 5000ms
Lock timeout: 30000ms
[2025-01-15T10:30:00.000Z] Checking for pending jobs...
Found 0 due job(s)
```

### Step 5.3: Test Worker with Scheduled Post

Create a post with `scheduledAt` set to a past time:

```bash
NOW=$(date +%s)000
PAST=$((NOW - 60000))  # 1 minute ago

curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d "{
    \"accountId\": \"test-account-001\",
    \"caption\": \"Worker test post\",
    \"platform\": \"facebook\",
    \"scheduledAt\": $PAST
  }"
```

**Watch worker output** — it should pick up the job and mark it as done:

```
[2025-01-15T10:30:05.000Z] Checking for pending jobs...
Found 1 due job(s)
[Job <job-id>] Locked and processing...
[Job <job-id>] Publishing to facebook...
✅ [Job <job-id>] Successfully published
```

---

## Phase 6: Create API Testing Collection

### Step 6.1: Postman/Insomnia Collection

**File**: `/home/neutrino/projects/meta-lab/testing/api-collection.json`

```json
{
  "info": {
    "name": "Meta Lab API",
    "description": "Local development API testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "account_id",
      "value": "test-account-001",
      "type": "string"
    },
    {
      "key": "post_id",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Accounts",
      "item": [
        {
          "name": "List all accounts",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/api/accounts",
              "host": ["{{base_url}}"],
              "path": ["api", "accounts"]
            }
          }
        }
      ]
    },
    {
      "name": "Posts",
      "item": [
        {
          "name": "Create post (draft)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"accountId\": \"{{account_id}}\", \"caption\": \"Test post\", \"platform\": \"facebook\"}"
            },
            "url": {
              "raw": "{{base_url}}/api/posts",
              "host": ["{{base_url}}"],
              "path": ["api", "posts"]
            }
          }
        },
        {
          "name": "List posts",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/api/posts/list?status=draft,scheduled&limit=10",
              "host": ["{{base_url}}"],
              "path": ["api", "posts", "list"],
              "query": [
                { "key": "status", "value": "draft,scheduled" },
                { "key": "limit", "value": "10" }
              ]
            }
          }
        },
        {
          "name": "Get post by ID",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/api/posts/{{post_id}}",
              "host": ["{{base_url}}"],
              "path": ["api", "posts", "{{post_id}}"]
            }
          }
        }
      ]
    },
    {
      "name": "Jobs",
      "item": [
        {
          "name": "Get jobs summary",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/api/jobs?summary=true",
              "host": ["{{base_url}}"],
              "path": ["api", "jobs"],
              "query": [
                { "key": "summary", "value": "true" }
              ]
            }
          }
        },
        {
          "name": "List pending jobs",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/api/jobs?status=pending&limit=20",
              "host": ["{{base_url}}"],
              "path": ["api", "jobs"],
              "query": [
                { "key": "status", "value": "pending" },
                { "key": "limit", "value": "20" }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

**Import into Postman/Insomnia** and use the collection to test all endpoints.

---

## Phase 7: Manual Testing Checklist

### Test Coverage Matrix

**Accounts**:
- [ ] List accounts returns all connected accounts
- [ ] Account data includes all required fields
- [ ] Multiple accounts can exist simultaneously

**Posts - Create**:
- [ ] Create draft post succeeds
- [ ] Create scheduled post (future time) creates job
- [ ] Create scheduled post (past time) creates job immediately ready
- [ ] Post with media uploads successfully
- [ ] Multiple media items maintain order
- [ ] Validation rejects missing accountId
- [ ] Validation rejects invalid platform
- [ ] Validation rejects non-existent accountId

**Posts - List**:
- [ ] List all posts works
- [ ] Filter by status works (draft, scheduled, published, failed)
- [ ] Filter by accountId works
- [ ] Filter by platform works
- [ ] Pagination (limit, offset) works
- [ ] Results sorted by createdAt descending
- [ ] Empty list handled gracefully

**Posts - Get Single**:
- [ ] Get post by ID returns post + media + job
- [ ] Get non-existent post returns 404
- [ ] Media array maintains order
- [ ] Job relationship populated correctly

**Jobs**:
- [ ] List jobs with status filter works
- [ ] Jobs summary endpoint returns counts
- [ ] Pending jobs query returns only due jobs
- [ ] Lock mechanism prevents duplicate processing

**Worker**:
- [ ] Worker picks up due jobs
- [ ] Worker marks job as running
- [ ] Worker publishes post and marks done
- [ ] Worker retries on error with backoff
- [ ] Worker fails after max attempts
- [ ] Post status updated on worker completion
- [ ] Lock timeout prevents stuck jobs

**Error Handling**:
- [ ] Invalid JSON returns 400
- [ ] Missing required fields returns 400 with details
- [ ] Invalid enum values returns 400
- [ ] Non-existent resources return 404
- [ ] Server errors return 500 with message
- [ ] All errors have code + message

---

## Phase 8: Troubleshooting Guide

### Issue: `MODULE_NOT_FOUND` errors

```bash
# Solution:
bun install
rm -rf node_modules/.bin
bun run dev
```

### Issue: Database locked error

```bash
# Solution: Check for multiple Next.js instances
lsof -i :3000
kill -9 <PID>
```

### Issue: MinIO connection refused

```bash
# Check if running:
docker ps | grep minio

# Restart if needed:
docker stop minio-local
docker run -d -p 9000:9000 -p 9001:9001 --name minio-local \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio:latest server /data --console-address ":9001"
```

### Issue: Worker not processing jobs

```bash
# Check worker is running:
ps aux | grep "worker"

# Verify database has pending jobs:
bun -e "
import { db } from './lib/db';
import { jobs } from './drizzle/schema';
import { eq } from 'drizzle-orm';
const pending = await db.select().from(jobs).where(eq(jobs.status, 'pending'));
console.log(pending);
"
```

### Issue: Test DB endpoint returns 404

```bash
# Ensure NODE_ENV=development
echo $NODE_ENV

# If not set:
export NODE_ENV=development
bun run dev
```

---

## Quick Start Commands

```bash
# 1. Install + Setup
bun install
cat > .env.local << 'EOF'
DATABASE_URL="file:./db.sqlite"
MINIO_ENDPOINT="127.0.0.1"
MINIO_PORT="9000"
MINIO_REGION="us-east-1"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="meta-lab-media"
MINIO_PUBLIC_URL="http://127.0.0.1:9000"
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000"
WORKER_POLL_INTERVAL_MS="5000"
WORKER_LOCK_TIMEOUT_MS="30000"
EOF

# 2. Apply migrations
bunx drizzle-kit migrate

# 3. Seed data (Terminal 1)
bun run dev

# 4. In new terminal, seed:
curl http://localhost:3000/api/test-db

# 5. Start worker (Terminal 2):
bun run worker/index.ts

# 6. Test API (Terminal 3):
curl http://localhost:3000/api/accounts
curl http://localhost:3000/api/jobs?summary=true
```

---

## Local Testing Workflow

```
┌──────────────────────────────────────────────┐
│ Terminal 1: Next.js App                      │
│ $ bun run dev                                │
│ ✓ http://localhost:3000                      │
└──────────────────────────────────────────────┘
         ↓ API Requests
┌──────────────────────────────────────────────┐
│ Terminal 2: Worker Process                   │
│ $ bun run worker/index.ts                    │
│ Polls jobs every 5s, processes async         │
└──────────────────────────────────────────────┘
         ↓ DB Updates
┌──────────────────────────────────────────────┐
│ SQLite Database                              │
│ ./db.sqlite (persistent)                     │
└──────────────────────────────────────────────┘
         ↓ Storage
┌──────────────────────────────────────────────┐
│ MinIO (Optional)                             │
│ http://127.0.0.1:9000 (media bucket)         │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Terminal 3: Testing                          │
│ $ curl http://localhost:3000/api/...         │
│ $ postman / insomnia (API collection)        │
└──────────────────────────────────────────────┘
```

---

## Next Steps After Testing

Once local testing passes:

1. **Staging Environment**:
   - Deploy to staging server (Ubuntu VM)
   - Use PostgreSQL instead of SQLite
   - Use actual MinIO or S3
   - Use real Meta API credentials

2. **Production Deployment**:
   - Follow deployment checklist (see separate doc)
   - Set up CI/CD pipeline
   - Configure monitoring & logging
   - Set up database backups

---

## Success Criteria

✅ All phases complete when:
- [ ] Next.js server starts without errors
- [ ] All migrations applied successfully
- [ ] Test data seeds correctly
- [ ] All 5 API routes respond correctly
- [ ] Worker picks up and processes jobs
- [ ] No TypeScript/lint errors
- [ ] Manual testing checklist 100% complete
- [ ] All error scenarios handled gracefully

**You're ready for deployment when all boxes are checked!**
