# Meta Lab — Complete Technical Reference

## Project Status: 🟢 Frontend Refinement

As of May 2026, Meta Lab has transitioned to "The Publishing Desk" aesthetic, featuring a high-density, custom-primitive-based UI. Core features including media auto-uploads, split-pane login, and multi-column scheduling are functional.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Meta Lab System                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Client Browser                                        │ │
│  └────────────────────────┬────────────────────────────┘ │
│                           │ HTTPS                        │
│  ┌────────────────────────▼────────────────────────────┐ │
│  │ Nginx Reverse Proxy (Port 443)                      │ │
│  │ - SSL/TLS termination                               │ │
│  │ - Rate limiting (2-10 req/s)                        │ │
│  │ - Static caching & compression                      │ │
│  └────────────────────────┬────────────────────────────┘ │
│                           │ Proxy pass :3000             │
│  ┌────────────────────────▼────────────────────────────┐ │
│  │ Next.js App (Port 3000)                             │ │
│  │ - 6 API endpoints                                   │ │
│  │ - Media upload/download                             │ │
│  │ - Database queries via Drizzle ORM                  │ │
│  └────────────────┬──────────────────────┬─────────────┘ │
│                   │                      │               │
│                   ▼ SQL                  ▼ HTTP          │
│  ┌─────────────────────────┐  ┌──────────────────────┐  │
│  │ SQLite Database         │  │ MinIO / S3 Storage   │  │
│  │ (db.sqlite)             │  │ (uploads, media)     │  │
│  │ - Posts                 │  │                      │  │
│  │ - Accounts              │  │ Or local storage:    │  │
│  │ - Media references      │  │ /storage/media/      │  │
│  │ - Jobs queue            │  └──────────────────────┘  │
│  └──────────────┬──────────┘                             │
│                 │                                        │
│                 ▼ SQL                                    │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Worker Process (Node.js)                            │ │
│  │ - Polls DB every 3s for due jobs                    │ │
│  │ - Locks jobs (atomic, 30s timeout)                  │ │
│  │ - Calls Meta Graph API (Facebook/Instagram)         │ │
│  │ - Handles retries with backoff                      │ │
│  │ - Updates job/post status                           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints (All Working ✅)

### Posts Management

**POST /api/posts** - Create post
- Input: accountId, caption, platform, scheduledAt, media[]
- Returns: post + media + job (if scheduled)
- Validations: Instagram requires media, valid account

**GET /api/posts/list** - List posts with filtering
- Query: status[], platform, accountId, scheduledBefore/After, limit, offset
- Returns: Array of posts ordered by createdAt

**GET /api/posts/[id]** - Get single post
- Returns: post + media array + job (if exists)

### Account Management

**GET /api/accounts** - List all connected accounts
- Returns: Array of { id, platform, name, pageId, igUserId }

### Job Management

**GET /api/jobs** - List jobs with optional filtering
- Query: status, postId, limit, offset, summary
- Returns: Jobs array or counts if summary=true

### Media Management

**POST /api/media/upload** - Upload media file
- Input: file (binary), postId (text), type (image|video)
- Returns: { media: { id, url, storageKey, publicUrl } }

**GET /api/media/serve/[...storageKey]** - Serve media (local mode only)
- Returns: File with proper Content-Type and cache headers

### Development

**GET /api/test-db** - Seed test data (dev-only)
- Creates 2 Facebook + 1 Instagram test accounts
- Idempotent (safe to call multiple times)

---

## Database Schema (SQLite)

### Table: accounts
```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  name TEXT NOT NULL,
  pageId TEXT,                    -- For Facebook
  igUserId TEXT,                  -- For Instagram
  accessToken TEXT NOT NULL,
  tokenExpiresAt INTEGER,         -- Optional expiry timestamp
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);
```

### Table: posts
```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  caption TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  status TEXT NOT NULL 
    CHECK (status IN ('draft', 'scheduled', 'processing', 'published', 'failed')),
  scheduledAt INTEGER,            -- Unix ms timestamp
  publishedAt INTEGER,
  createdAt INTEGER NOT NULL,
  error TEXT,
  FOREIGN KEY (accountId) REFERENCES accounts(id)
);
```

### Table: media
```sql
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL,
  url TEXT NOT NULL,              -- Storage key or signed URL
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  orderIndex INTEGER NOT NULL,    -- Position in carousel
  FOREIGN KEY (postId) REFERENCES posts(id)
);
```

### Table: jobs
```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL,
  runAt INTEGER NOT NULL,         -- Unix ms timestamp
  status TEXT NOT NULL 
    CHECK (status IN ('pending', 'running', 'done', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  lockedAt INTEGER,               -- For atomic locking (30s timeout)
  lastError TEXT,
  FOREIGN KEY (postId) REFERENCES posts(id)
);
```

---

## Worker Job Processing Flow

```
┌─────────────────────────────────────────────────┐
│ Worker Polling Loop (every 3 seconds)           │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Query: SELECT * FROM jobs WHERE              │
│   status = 'pending' AND                     │
│   runAt <= NOW() AND                         │
│   (lockedAt IS NULL OR lockedAt < NOW()-30s) │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
       ┌───────────────────────────┐
       │ For each due job (max 3): │
       └───────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ LOCK Job             │
        │ UPDATE jobs SET:     │
        │   status='running'   │
        │   lockedAt=now()     │
        └──────────┬───────────┘
                   │
                   ▼
   ┌────────────────────────────────┐
   │ Fetch post + media + account  │
   └────────────┬───────────────────┘
                │
                ▼
    ┌─────────────────────────────┐
    │ Preflight Validation:       │
    │ - Token exists              │
    │ - pageId (Facebook)         │
    │ - igUserId (Instagram)      │
    │ - Media exists (Instagram)  │
    └────────┬────────────────────┘
             │
             ▼
  ┌─────────────────────────────────┐
  │ Get Signed URLs for Media       │
  │ (if MINIO_STORAGE_MODE=minio)   │
  │ Presigned URL valid 7 days      │
  └────────┬────────────────────────┘
           │
           ├─► Facebook Path        Instagram Path
           │   ├─────────────────┬──────────────────┐
           │   ▼                 ▼                  │
           │ POST /feed        POST /media         │
           │ or /photos        (create container)  │
           │ or /videos        POST /media_publish │
           │   │                                   │
           │   ├──────────────────┬────────────────┤
           │   ▼                  ▼                │
           │ Success?           Success?           │
           │   │                  │                │
           │   YES                YES              │
           │   │                  │                │
           │   └──────────┬───────┘                │
           │              ▼                        │
           │    ┌──────────────────────────┐      │
           │    │ UPDATE posts SET:        │      │
           │    │   status='published'     │      │
           │    │   publishedAt=now()      │      │
           │    └──────────┬───────────────┘      │
           │               ▼                      │
           │    ┌──────────────────────────┐      │
           │    │ UPDATE jobs SET:         │      │
           │    │   status='done'          │      │
           │    │   lockedAt=NULL          │      │
           │    └──────────────────────────┘      │
           │                                      │
           └──────────────────────────────────────┘

ON ERROR:
┌──────────────────────────────────────┐
│ Attempts < 3?                        │
├──────────────────────────────────────┤
│ YES: Apply Backoff + Reschedule      │
│      Attempt 1: +2 minutes           │
│      Attempt 2: +5 minutes           │
│      Attempt 3: Mark FAILED          │
│                                      │
│ NO: Mark FAILED, Store Error         │
│     UPDATE posts.error               │
│     UPDATE jobs.lastError            │
└──────────────────────────────────────┘
```

---

## Meta Graph API Integration

### Facebook Publisher (lib/meta/facebook.ts)

**Text-only post:**
```
POST /v20.0/{pageId}/feed
  caption: "Hello world"
  access_token: token
```

**Photo post:**
```
POST /v20.0/{pageId}/photos
  url: "https://signed-url.com/image.jpg"
  caption: "Photo caption"
  access_token: token
```

**Video post:**
```
POST /v20.0/{pageId}/videos
  file_url: "https://signed-url.com/video.mp4"
  title: "Video title"
  description: "Description"
  access_token: token
```

### Instagram Publisher (lib/meta/instagram.ts)

**Step 1: Create Media Container**
```
POST /v20.0/{igUserId}/media
  image_url: "https://signed-url.com/image.jpg"
  caption: "Photo caption"
  access_token: token
Response: { id: "container-id" }
```

**Step 2: Publish Container**
```
POST /v20.0/{igUserId}/media_publish
  creation_id: "container-id"
  access_token: token
Response: { id: "published-media-id" }
```

### Error Handling

**Token Errors** (detected by error code 190, OAuthException):
- Marked as retryable
- Job retried with backoff
- Admin notified via error field

**Rate Limits** (error code 429, 4):
- Detected and handled
- Job retried after backoff
- Prevents API abuse

**Network Errors** (timeout, DNS, etc.):
- Retried automatically
- Backoff applied between attempts

---

## Storage Configuration

### Local Mode (Development)

```env
MINIO_STORAGE_MODE=local
```

**Behavior:**
- Files stored in `./storage/media/` directory
- URLs: `/api/media/serve/{storageKey}`
- No external service required
- Perfect for local development

**File Path Format:**
```
./storage/media/posts/1712345678901-abc123def.jpg
                     ↑                         ↑
                   timestamp            random 9 chars
```

### MinIO Mode (Production)

```env
MINIO_STORAGE_MODE=minio
MINIO_ENDPOINT=minio.example.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=secret
MINIO_REGION=us-east-1
MINIO_BUCKET=media
```

**Behavior:**
- Files uploaded to remote S3-compatible service
- URLs: Presigned (time-limited, 7 days default)
- Automatic bucket creation on startup
- Supports AWS S3, MinIO, DigitalOcean Spaces, etc.

---

## Docker Deployment

### Service Composition

```yaml
metalab-app:              # Next.js + API
  Port: 3000
  Command: npm start
  Health: wget /api/accounts
  Restart: unless-stopped

metalab-worker:           # Job processor
  Command: npx tsx worker/index.ts
  Restart: unless-stopped
  Depends: metalab-app

nginx:                    # Reverse proxy
  Port: 80 (redirect), 443 (HTTPS)
  Depends: metalab-app
  Restart: unless-stopped

minio: (optional)        # S3-compatible storage
  Port: 9000 (API), 9001 (Console)
  Volumes: /data/minio/data
```

### Directory Layout

```
/data/
├── app/
│   ├── db.sqlite                    # SQLite database
│   ├── .env.production              # Production secrets
│   ├── storage/media/               # Local media (if local mode)
│   ├── node_modules/
│   ├── .next/                       # Built Next.js
│   └── ... (source code)
├── nginx/
│   ├── conf.d/metalab.conf          # Nginx config
│   ├── certs/
│   │   ├── metalab.crt              # SSL cert
│   │   └── metalab.key              # SSL key
│   └── html/                        # Static files
├── minio/
│   └── data/                        # MinIO storage
├── .env                             # Docker Compose env
└── docker-compose.yml               # Container spec
```

---

## Security Measures

### SSL/TLS
- TLSv1.2 and 1.3 only
- Modern cipher suites only
- HSTS headers (1 year)
- Certificate pinning (if needed)

### HTTP Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Permissions-Policy: geolocation=(), microphone=(), camera=()
Referrer-Policy: no-referrer-when-downgrade
```

### Rate Limiting
- Media upload: 2 req/s per IP
- API endpoints: 10 req/s per IP
- Presigned URLs: 7-day expiry
- Job locking: 30-second timeout (atomic)

### Input Validation
- File size: max 100MB
- File types: JPEG, PNG, GIF, WebP (images); MP4, MOV, AVI (videos)
- Content-Type validation
- Directory traversal prevention

### Secrets Management
- `.env.production` file (chmod 600)
- Not in git repository
- Docker secret injection (for production)
- Tokens stored in SQLite (consider encryption later)

---

## Monitoring & Observability

### Key Metrics

**Job Processing:**
```sql
SELECT status, COUNT(*) FROM jobs GROUP BY status;
```

**Publishing Failures:**
```sql
SELECT id, error, attempts FROM posts 
WHERE status = 'failed' ORDER BY createdAt DESC;
```

**Token Expiry:**
```sql
SELECT name, (tokenExpiresAt - strftime('%s', 'now') * 1000) / 86400000 as days_until_expiry 
FROM accounts;
```

### Health Checks

**API Health:**
```bash
curl https://poster.yourdomain.com/api/accounts
```

**Worker Status:**
```bash
docker ps | grep metalab-worker
```

**Database Health:**
```bash
sqlite3 /data/app/db.sqlite ".tables"
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f metalab-worker

# Last 50 lines
docker-compose logs --tail=50 metalab-app

# Specific timeframe
docker-compose logs --since 1h metalab-worker
```

---

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Post Creation | <100ms | Synchronous, no external calls |
| Job Lock Timeout | 30s | Prevents duplicate execution |
| Worker Poll Interval | 3s | Configurable, default 3000ms |
| Max Concurrent Jobs | 3 | Per poll cycle, configurable |
| Media Upload Limit | 100MB | Per file |
| Media URL Cache | 365 days | Immutable, aggressive caching |
| API Rate Limit | 10 req/s | Per IP per zone |
| Upload Rate Limit | 2 req/s | Per IP per zone |
| Database Size | <500MB | Typical after 1 year of posts |
| Token Expiry | 60 days | Default, can request long-lived |

---

## Deployment Checklist

### Pre-Deployment
- [ ] Domain configured and resolving
- [ ] SSL certificate ready (Let's Encrypt or self-signed)
- [ ] Docker and Docker Compose installed
- [ ] Meta Graph API tokens obtained
- [ ] MinIO credentials prepared (if using remote storage)
- [ ] Firewall rules configured (80, 443)
- [ ] Backup strategy planned

### Initial Setup
- [ ] Run deployment script: `sudo bash deploy.sh domain.com`
- [ ] Edit `.env.production` with credentials
- [ ] Edit `/data/.env` with MinIO keys
- [ ] Verify SSL certificates in place
- [ ] Build and test locally first

### Launch
- [ ] Start Docker Compose: `docker-compose up -d`
- [ ] Monitor logs: `docker-compose logs -f`
- [ ] Test API: `curl https://domain.com/api/accounts`
- [ ] Create test account in SQLite
- [ ] Create test post and verify publishing

### Post-Deployment
- [ ] Set up automated backups
- [ ] Configure monitoring/alerting
- [ ] Enable SSL certificate auto-renewal
- [ ] Schedule regular security updates
- [ ] Monitor disk usage and cleanup policies

---

## Future Enhancements (Out of Scope)

- [ ] OAuth token refresh flow
- [ ] Multi-user authentication
- [ ] Frontend dashboard and UI
- [ ] Post analytics
- [ ] Carousel/album support (Instagram)
- [ ] Webhook-based job execution (instead of polling)
- [ ] PostgreSQL migration (if SQLite becomes bottleneck)
- [ ] Redis caching layer
- [ ] Elasticsearch for post search
- [ ] Media transcoding/optimization

---

## Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| DEVOPS_GUIDE.md | 1000+ | Comprehensive deployment guide |
| DEPLOYMENT_QUICKSTART.md | 300+ | Quick reference for deployment |
| AGENTS.md | 550+ | Architecture and project context |
| docker-compose.yml | 95 | Container orchestration |
| lib/minio/client.ts | 280 | Storage abstraction (local/S3) |
| app/api/media/upload/route.ts | 90 | Media upload endpoint |
| app/api/media/serve/route.ts | 85 | Media download endpoint |
| lib/meta/client.ts | 150 | Graph API wrapper |
| lib/meta/facebook.ts | 90 | Facebook publisher |
| lib/meta/instagram.ts | 120 | Instagram publisher |
| worker/processor.ts | 200+ | Job processing logic |

---

## Support & Troubleshooting

**Worker not running:**
```bash
docker-compose logs metalab-worker
docker-compose restart metalab-worker
```

**API not responding:**
```bash
docker-compose ps
curl http://localhost:3000/api/accounts
```

**Media upload failing:**
```bash
# Check MinIO
curl https://minio.example.com
# Check storage mode
docker exec metalab-app echo $MINIO_STORAGE_MODE
```

**Database locked:**
```sql
-- Force unlock
UPDATE jobs SET status='pending', lockedAt=NULL WHERE id='job-id';
```

**SSL certificate issues:**
```bash
# Check expiry
openssl x509 -enddate -noout -in /data/nginx/certs/metalab.crt
# Renew
certbot renew --force-renewal
```

---

**Status**: Production Ready ✅
**Last Updated**: 2026-04-16
**Commit**: babf4e7

For questions or issues, refer to DEVOPS_GUIDE.md or DEPLOYMENT_QUICKSTART.md
