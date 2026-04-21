# Meta Lab - Session Memory & Progress Tracking

**Last Updated:** Thu Apr 16 2026  
**Project Status:** Backend complete, DevOps complete, documentation complete. Frontend & deployment testing pending.

---

## ✅ Completed in Previous Sessions

### Backend Development (100%)
- **API Endpoints:** 5 core REST endpoints (posts, accounts, jobs)
- **Storage System:** MinIO integration with local development fallback
- **Meta Graph API Integration:** Facebook & Instagram publishers with error handling & retries
- **Job Queue:** Database-backed scheduler with atomic locking & automatic retries
- **Database:** SQLite schema with 4 tables (accounts, posts, media, jobs)
- **Worker:** Node.js polling process for executing scheduled tasks

### DevOps & Infrastructure (100%)
- **Docker Compose:** 3-service stack (Next.js app, Worker, SQLite)
- **Nginx:** Reverse proxy configuration with SSL/TLS support
- **Deployment Automation:** Automated deploy.sh script with health checks
- **Environment Configuration:** Support for dev, production, and dry-run modes

### Documentation (100%)
- **Organized Structure:** All docs moved to `docs/` directory with subdirectories
  - `docs/devops/` - Deployment guides (DEVOPS_GUIDE.md, DEPLOYMENT_QUICKSTART.md)
  - `docs/technical/` - Technical reference (TECHNICAL_REFERENCE.md)
  - `docs/design/` - UI/UX specs (UI_DESIGN_SPEC.md)
  - `docs/README.md` - Central navigation index
  - Root `README.md` - Updated project overview
- **Total Documentation:** 1300+ lines across 9 files
- **Git Commit:** `9da55bf` - "Reorganize documentation into clean docs directory structure"

### Research Completed (This Session)
- **MinIO & Meta Graph API:** Researched media URL requirements for Meta platforms
- **Security & Firewall:** Identified issues with private MinIO and public Meta API integration
- **Setup Requirements:** Documented complete setup checklist

---

## ⏳ In Progress / Next Steps

### 🔴 CRITICAL BLOCKER: Media URL Accessibility

**Problem:** Meta Graph API requires publicly accessible media URLs to download images/videos when publishing to Instagram or Facebook with media. Your firewall blocks external access.

**Current Implementation Issue:**
- MinIO is private (behind firewall) ✅
- Worker tries to pass MinIO URLs to Meta API ❌
- Meta servers cannot download media (403 Forbidden expected) ❌
- Instagram posts will fail (requires media)
- Facebook photo/video posts will fail

**Recommended Solutions (Pick One):**

1. **Use Local Storage Mode + Proxy** (Recommended for Testing)
   - `MINIO_STORAGE_MODE=local` - store files locally on server
   - Create public proxy endpoint that validates requests before serving media
   - Meta calls proxy → proxy validates → fetches from local storage
   - Works for MVP testing
   - Status: Not yet implemented

2. **Public Cloud Storage** (Recommended for Production)
   - Switch to AWS S3 / Cloudflare R2 / Google Cloud Storage
   - Media stored externally, publicly accessible
   - Meta can download directly
   - Most secure and scalable
   - Status: Not yet implemented

3. **Expose MinIO Publicly** (Not Recommended)
   - Open MinIO port to internet (high security risk)
   - Meta downloads directly from MinIO
   - Status: Not yet implemented

4. **Text-Only Posts Only** (Workaround)
   - Disable media support, post text-only to Facebook
   - Instagram requires media, so IG won't work
   - Not a viable solution
   - Status: Current default behavior

### 🟡 Priority: Deployment Setup

**What's Needed:**
1. Subdomain with DNS configured (e.g., `poster.yourdomain.com`)
2. SSL certificate (Let's Encrypt recommended)
3. Firewall rules: Allow port 443 (HTTPS) inbound only
4. Docker & Docker Compose installed on server
5. Decision on media storage solution (above)

**Status:** Not yet started - waiting for decision on storage solution

**Files to Reference:**
- `docs/devops/DEPLOYMENT_QUICKSTART.md` - 5-minute setup guide
- `docs/devops/DEVOPS_GUIDE.md` - Comprehensive deployment manual
- `nginx.conf.template` - Nginx configuration in root
- `docker-compose.yml` - Container orchestration in root

### 🟡 Priority: Meta App Setup

**What's Needed:**
1. Create Meta Developer Account (free)
2. Create Test Facebook App in Meta Developer Console
3. Create Test Facebook Page
4. Generate access token with `pages_manage_posts` permission
5. For Instagram testing: Business Account + IG User ID
6. Store tokens in `.env.local`

**Status:** Not yet started

**Tokens to Configure:**
```env
# For Facebook
FACEBOOK_PAGE_ID=
FACEBOOK_ACCESS_TOKEN=

# For Instagram
INSTAGRAM_USER_ID=
INSTAGRAM_ACCESS_TOKEN=
```

### 🟢 Frontend Development (Ready to Start)

**What's Needed:**
1. Review `docs/design/UI_DESIGN_SPEC.md` for 6 screens design
2. Build React components for:
   - Posts screen (create, list, schedule)
   - Schedule calendar view
   - Media management
   - Accounts management
   - Jobs monitoring
   - Settings
3. Integrate with existing API endpoints (all documented in `docs/technical/TECHNICAL_REFERENCE.md`)

**Status:** Design specs complete, ready for implementation. All backend APIs available.

---

## 🔧 Current Environment Configuration

**Storage Mode (Development):**
```env
MINIO_STORAGE_MODE=local  # Files stored in ./storage/media/
```

**Meta API (Testing):**
```env
META_DRY_RUN=true  # Set to false when ready for real API calls
META_GRAPH_VERSION=v20.0
META_GRAPH_TIMEOUT=30000
```

**Worker (Testing):**
```env
WORKER_POLL_INTERVAL=3000  # 3 seconds
WORKER_MAX_CONCURRENT=3
```

---

## 📋 Setup Checklist for Next Session

### Before Deployment:
- [ ] Decide on media storage solution (cloud vs. proxy)
- [ ] Register subdomain (e.g., poster.yourdomain.com)
- [ ] Obtain SSL certificate
- [ ] Configure firewall rules
- [ ] Create Meta Developer Account
- [ ] Create Test Facebook App
- [ ] Create Test Facebook Page
- [ ] Generate access tokens
- [ ] Install Docker & Docker Compose on server

### Before Testing:
- [ ] Implement chosen media storage solution
- [ ] Update `.env` with Meta tokens
- [ ] Update `.env` with storage configuration
- [ ] Deploy using `deploy.sh`
- [ ] Verify all services running: `docker-compose ps`
- [ ] Test API endpoints (see `docs/technical/TECHNICAL_REFERENCE.md`)

### Testing Flow:
1. Create test account via API
2. Create test post (text-only initially)
3. Verify job created in database
4. Wait for worker to execute (monitor logs)
5. Check if post published to Meta
6. Debug any errors
7. Add media posts once media URL solution is working

---

## 📁 Key File Locations

**Deployment Files (Root):**
- `docker-compose.yml` - Container orchestration
- `nginx.conf.template` - Nginx reverse proxy config
- `deploy.sh` - Automated deployment script
- `.env.local` - Environment variables (not in git)

**Documentation:**
- `docs/README.md` - Central navigation
- `docs/devops/DEPLOYMENT_QUICKSTART.md` - Quick start
- `docs/technical/TECHNICAL_REFERENCE.md` - API reference
- `docs/design/UI_DESIGN_SPEC.md` - UI/UX specs

**Application Code:**
- `app/` - Next.js app (API routes, layout, pages)
- `lib/` - Backend logic (db, meta, minio, posts, jobs, accounts)
- `worker/` - Job processor (index.ts, processor.ts)
- `drizzle/` - Database schema and migrations

---

## 🎯 Decision Needed from User

**Before next session, decide:**

1. **Media Storage Solution:**
   - [ ] Use local storage + proxy (for MVP testing)
   - [ ] Use AWS S3 / Cloudflare R2 (for production)
   - [ ] Other (specify)

2. **Deployment Timeline:**
   - [ ] Deploy this week
   - [ ] Deploy next week
   - [ ] Need more time for preparation

3. **Next Work Priority:**
   - [ ] Fix media URL issue first
   - [ ] Set up deployment infrastructure first
   - [ ] Start frontend development first
   - [ ] Other (specify)

---

## 📝 Notes for Next Session Agent

- **Production-Ready:** All backend, storage, and DevOps infrastructure is complete
- **Well Documented:** 1300+ lines of comprehensive guides and API reference
- **Main Blocker:** Media URL accessibility for Meta API (firewall + public URLs)
- **No Code Changes Needed Yet:** Just decisions and configuration
- **Frontend Can Start:** While deployment/storage decisions are being made
- **Risk:** If media storage not resolved, Instagram posting won't work

---

## 🔗 Related Documentation

- [Meta Graph API Requirements](docs/technical/TECHNICAL_REFERENCE.md#meta-graph-api-integration)
- [Storage Configuration](docs/README.md#storage-configuration-local-vs-production)
- [Deployment Guide](docs/devops/DEPLOYMENT_QUICKSTART.md)
- [API Endpoints Reference](docs/technical/TECHNICAL_REFERENCE.md#api-endpoints)
- [Worker Job Processing](docs/README.md#job-processing-explanation)
