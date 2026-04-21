# Technical Documentation

Architecture, API reference, and system design documentation.

---

## 📖 References

### Complete Technical Reference
**[TECHNICAL_REFERENCE.md](./TECHNICAL_REFERENCE.md)** — 640+ lines

Comprehensive technical documentation covering:
- System architecture and components
- All 9 API endpoints with examples
- Database schema (4 tables, constraints)
- Worker job processing flow
- Meta Graph API integration details
- Storage configuration (local vs. MinIO/S3)
- Docker deployment specifications
- Security measures and hardening
- Performance characteristics
- Monitoring and observability
- Troubleshooting guide

**Use when:** Understanding the system design, implementing features, debugging

---

## 🏗️ System Architecture

### High-Level Flow
```
Browser (HTTPS)
    ↓
Nginx (SSL/TLS, rate limiting, caching)
    ↓
Next.js App (API endpoints)
    ├─ Database (SQLite) ← CRUD operations
    ├─ Storage (MinIO/S3) ← Media files
    └─ Worker Queue (Jobs table) ← Publishing tasks

Background Worker (Node.js)
    ├─ Polls DB every 3 seconds
    ├─ Locks jobs (atomic, 30s timeout)
    ├─ Calls Meta Graph API
    └─ Updates job/post status with retries
```

### Component Interaction
```
Request Flow:
1. Client sends HTTPS request
2. Nginx proxies to Next.js (3000)
3. Next.js processes API request
4. Database operations via Drizzle ORM
5. Response returned through Nginx

Auth Flow:
1. User submits credentials to `/api/auth/login`
2. Server validates against `AUTH_USERNAME`/`AUTH_PASSWORD`
3. Server sets `meta_lab_session` HttpOnly cookie
4. `middleware.ts` validates cookie signature and expiry per request
5. Unauthenticated users are redirected to `/login`

Publishing Flow:
1. User creates post with scheduled time
2. Job created in SQLite queue
3. Worker polls and locks job
4. Worker fetches media and account data
5. Worker calls Meta Graph API
6. Meta API publishes to Facebook/Instagram
7. Worker updates post status
```

---

## 📡 API Reference

### Available Endpoints

**Posts:**
- `POST /api/posts` — Create post (draft or scheduled)
- `GET /api/posts/list` — List posts with filtering
- `GET /api/posts/[id]` — Get single post with media

**Accounts:**
- `GET /api/accounts` — List all connected accounts

**Jobs:**
- `GET /api/jobs` — List jobs with optional summary

**Media:**
- `POST /api/media/upload` — Upload media file
- `GET /api/media/serve/[...storageKey]` — Download media (local mode)

**Development:**
- `GET /api/test-db` — Seed test data (dev-only)

**Authentication:**
- `POST /api/auth/login` — Create authenticated session cookie
- `POST /api/auth/logout` — Clear authenticated session
- `GET /api/auth/session` — Validate active session

**Details:** See [TECHNICAL_REFERENCE.md - API Endpoints](./TECHNICAL_REFERENCE.md#api-endpoints)

---

## 🗄️ Database Schema

### 4 Tables

**accounts**
```sql
id (text PK)
platform (facebook | instagram)
name (text)
pageId (text, Facebook only)
igUserId (text, Instagram only)
accessToken (text)
tokenExpiresAt (integer, optional)
```

**posts**
```sql
id (text PK)
accountId (text FK → accounts)
caption (text)
platform (text)
status (draft | scheduled | processing | published | failed)
scheduledAt (integer, Unix ms)
publishedAt (integer, Unix ms)
createdAt (integer, Unix ms)
error (text, error message on failure)
```

**media**
```sql
id (text PK)
postId (text FK → posts)
url (text, storage key or signed URL)
type (image | video)
orderIndex (integer, position in carousel)
```

**jobs**
```sql
id (text PK)
postId (text FK → posts)
runAt (integer, Unix ms timestamp)
status (pending | running | done | failed)
attempts (integer)
lockedAt (integer, for atomic locking)
lastError (text)
```

**Details:** See [TECHNICAL_REFERENCE.md - Database Schema](./TECHNICAL_REFERENCE.md#database-schema-sqlite)

---

## 🔄 Job Processing

### Worker Flow
```
1. Query for due jobs (runAt <= now, not locked)
2. Lock job atomically (status=running, lockedAt=now)
3. Fetch post, media, and account data
4. Validate: token, pageId (FB), igUserId (IG), media (IG)
5. Get signed URLs for media files
6. Call Meta Graph API
   - Facebook: POST /feed, /photos, or /videos
   - Instagram: POST /media (container), then /media_publish
7. On success: Update post status to published, job status to done
8. On error: Apply retry backoff, reschedule if attempts < 3

Retry Policy:
- Attempt 1: +2 minutes
- Attempt 2: +5 minutes
- Attempt 3: Mark permanently failed
```

**Details:** See [TECHNICAL_REFERENCE.md - Worker Job Processing Flow](./TECHNICAL_REFERENCE.md#worker-job-processing-flow)

---

## 🎯 Meta Graph API

### Facebook Publisher
**Endpoints:**
- Text-only: `POST /{pageId}/feed`
- Photos: `POST /{pageId}/photos`
- Videos: `POST /{pageId}/videos`

**Parameters:**
```
caption: "Post text"
access_token: "page-access-token"
```

### Instagram Publisher
**Two-step process:**
1. Create container: `POST /{igUserId}/media`
2. Publish: `POST /{igUserId}/media_publish`

**Parameters:**
```
image_url: "https://signed-url/image.jpg"  (or video_url)
caption: "Post text"
access_token: "user-access-token"
```

**Details:** See [TECHNICAL_REFERENCE.md - Meta Graph API Integration](./TECHNICAL_REFERENCE.md#meta-graph-api-integration)

---

## 💾 Storage Configuration

### Local Mode (Development)
- Files stored in `./storage/media/`
- URLs: `/api/media/serve/{storageKey}`
- Key format: `posts/{timestamp}-{random}.{ext}`
- Perfect for local testing, no external dependencies

### MinIO/S3 Mode (Production)
- Files uploaded to S3-compatible service
- URLs: Presigned (7-day expiry)
- Supports AWS S3, MinIO, DigitalOcean Spaces
- Automatic bucket creation on startup
- Presigned URLs prevent long-term file access

**Details:** See [TECHNICAL_REFERENCE.md - Storage Configuration](./TECHNICAL_REFERENCE.md#storage-configuration)

---

## 🔒 Security

### Key Measures
- SSL/TLS (TLSv1.2+, modern ciphers)
- HSTS headers (1-year max-age)
- Rate limiting (DDoS protection)
- File validation (size, type, content)
- Directory traversal prevention
- Atomic job locking (prevents duplicates)
- Presigned URLs (time-limited access)
- Security headers (CSP, X-Frame-Options, XSS-Protection)

### Validation
- File size: max 100MB
- File types: JPEG, PNG, GIF, WebP (images); MP4, MOV, AVI (videos)
- Content-Type validation
- Directory traversal checks

**Details:** See [TECHNICAL_REFERENCE.md - Security Measures](./TECHNICAL_REFERENCE.md#security-measures)

---

## 📊 Performance

### Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Post Creation | <100ms | Synchronous, no external calls |
| Job Lock Timeout | 30s | Prevents duplicate execution |
| Worker Poll Interval | 3s | Configurable (default) |
| Max Concurrent Jobs | 3 | Per poll cycle |
| Media Upload Limit | 100MB | Per file |
| API Rate Limit | 10 req/s | Per IP |
| Upload Rate Limit | 2 req/s | Per IP |
| Media Cache Duration | 365 days | Immutable files |
| Token Expiry | 60 days | Default (can request long-lived) |

**Details:** See [TECHNICAL_REFERENCE.md - Performance Characteristics](./TECHNICAL_REFERENCE.md#performance-characteristics)

---

## 🐳 Docker Deployment

### Services
```yaml
metalab-app:        # Next.js application
  Port: 3000
  Health: GET /api/accounts
  
metalab-worker:     # Job executor
  Command: npx tsx worker/index.ts
  
nginx:              # Reverse proxy
  Ports: 80, 443
  
minio: (optional)   # S3-compatible storage
  Ports: 9000, 9001
```

When running outside Docker locally, use `npm run worker`.

### Directory Layout
```
/data/
├── app/                      # Application code
│   ├── db.sqlite            # SQLite database
│   ├── storage/media/       # Local media (if applicable)
│   └── .env.production      # Production secrets
├── nginx/
│   ├── conf.d/metalab.conf
│   └── certs/
│       ├── metalab.crt
│       └── metalab.key
├── minio/data/              # MinIO storage (if self-hosted)
├── .env                     # Docker Compose environment
└── docker-compose.yml       # Container specification
```

**Details:** See [TECHNICAL_REFERENCE.md - Docker Deployment](./TECHNICAL_REFERENCE.md#docker--container-setup)

---

## 📈 Monitoring

### Key Metrics

**Job Status:**
```sql
SELECT status, COUNT(*) FROM jobs GROUP BY status;
```

**Failed Posts:**
```sql
SELECT id, error FROM posts WHERE status='failed' ORDER BY createdAt DESC;
```

**Token Expiry:**
```sql
SELECT name, (tokenExpiresAt - strftime('%s', 'now') * 1000) / 86400000 as days_until_expiry FROM accounts;
```

**Disk Usage:**
```bash
du -sh /data/*
```

**Details:** See [TECHNICAL_REFERENCE.md - Monitoring & Observability](./TECHNICAL_REFERENCE.md#monitoring--observability)

---

## 🆘 Troubleshooting

### Common Issues

**Worker not processing jobs:**
```bash
docker-compose logs metalab-worker
```

**API not responding:**
```bash
docker-compose ps
curl http://localhost:3000/api/accounts
```

**Media upload failing:**
```bash
echo $MINIO_STORAGE_MODE
curl https://minio.example.com
```

**Database locked:**
```sql
-- Find stuck jobs
SELECT * FROM jobs WHERE status='running' AND lockedAt < now() - 30000;
-- Force unlock
UPDATE jobs SET status='pending', lockedAt=NULL WHERE id='job-id';
```

**Details:** See [TECHNICAL_REFERENCE.md - Troubleshooting](./TECHNICAL_REFERENCE.md#supporttroubleshooting)

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `lib/minio/client.ts` | Storage abstraction (local/S3) |
| `lib/auth/session.ts` | Session token creation and verification |
| `lib/auth/credentials.ts` | Credential validation from environment |
| `middleware.ts` | Route-level authentication gate |
| `app/api/media/upload/route.ts` | Media upload endpoint |
| `app/api/media/serve/route.ts` | Media download endpoint |
| `lib/meta/client.ts` | Graph API wrapper |
| `lib/meta/facebook.ts` | Facebook publisher |
| `lib/meta/instagram.ts` | Instagram publisher |
| `worker/processor.ts` | Job processing logic |
| `lib/posts/service.ts` | Post CRUD operations |
| `drizzle/schema.ts` | Database schema |

---

## 🔗 Related Documentation

- **[DevOps Guide](../devops/DEVOPS_GUIDE.md)** — Deployment and operations
- **[Deployment QuickStart](../devops/DEPLOYMENT_QUICKSTART.md)** — 5-minute deployment
- **[Testing Guide](../TESTING_GUIDE.md)** — Development and testing
- **[Design Specs](../design/UI_DESIGN_SPEC.md)** — Frontend specifications

---

**Last Updated:** 2026-04-16
**Status:** Production Ready ✅

For deployment questions, see [DevOps Documentation](../devops/README.md)
For development questions, see [Testing Guide](../TESTING_GUIDE.md)
