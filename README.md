# Meta Lab

A self-hosted social media scheduling system for Facebook Pages and Instagram Business accounts.

**Status:** Production Ready ✅

---

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Deployment
```bash
sudo bash deploy.sh poster.yourdomain.com https://github.com/yourrepo/meta-lab.git
cd /data && docker-compose up -d
```

See [docs/devops/DEPLOYMENT_QUICKSTART.md](./docs/devops/DEPLOYMENT_QUICKSTART.md) for detailed setup.

---

## 📚 Documentation

All documentation is organized in the `docs/` directory:

### 🔧 DevOps & Deployment
- **[DevOps QuickStart](./docs/devops/DEPLOYMENT_QUICKSTART.md)** — 5-minute deployment guide
- **[Complete DevOps Guide](./docs/devops/DEVOPS_GUIDE.md)** — Comprehensive operations manual
- See [docs/devops/README.md](./docs/devops/README.md) for overview

### 💻 Technical Reference
- **[Technical Reference](./docs/technical/TECHNICAL_REFERENCE.md)** — System architecture, APIs, database schema
- **[Testing Guide](./docs/TESTING_GUIDE.md)** — Development and testing procedures
- See [docs/technical/README.md](./docs/technical/README.md) for overview

### 🎨 Frontend Design
- **[UI Design Specification](./docs/design/UI_DESIGN_SPEC.md)** — Screen designs and components
- See [docs/design/README.md](./docs/design/README.md) for overview

### 📖 Documentation Index
- **[Complete Documentation Index](./docs/README.md)** — Navigate all guides and references

---

## 🏗️ Project Structure

```
meta-lab/
├── app/                        # Next.js application
│   ├── api/                   # API endpoints
│   ├── page.tsx               # Home page
│   └── layout.tsx             # Root layout
│
├── lib/                        # Backend logic
│   ├── db/                    # Database setup
│   ├── api/                   # Error/validation helpers
│   ├── meta/                  # Meta Graph API wrapper
│   ├── minio/                 # Storage client
│   ├── posts/                 # Post service
│   ├── jobs/                  # Job service
│   └── accounts/              # Account service
│
├── worker/                     # Background job processor
│   ├── index.ts               # Polling loop
│   └── processor.ts           # Job execution
│
├── drizzle/                    # Database schema
│   ├── schema.ts              # Table definitions
│   └── migrations/            # Database migrations
│
├── docs/                       # Documentation
│   ├── devops/                # Deployment guides
│   ├── technical/             # Technical reference
│   ├── design/                # UI/UX specifications
│   └── README.md              # Documentation index
│
├── docker-compose.yml         # Container orchestration
├── nginx.conf.template        # Reverse proxy config
├── deploy.sh                  # Automated deployment
├── AGENTS.md                  # AI agent context
├── package.json               # Dependencies
└── README.md                  # This file
```

---

## ⚡ Features

### Core Functionality
- ✅ Create posts with images/videos
- ✅ Schedule posts for future publishing
- ✅ Publish to multiple accounts (Facebook Pages + Instagram Business)
- ✅ Background job queue with automatic retry
- ✅ Media storage (local or S3-compatible)
- ✅ Complete REST API
- ✅ Session-based authentication (login + route protection)
- ✅ Chakra UI operator dashboard (dashboard, posts, jobs, accounts, media)

### Infrastructure
- ✅ Docker Compose containerization
- ✅ Nginx reverse proxy with SSL/TLS
- ✅ SQLite database with Drizzle ORM
- ✅ Automated deployment script
- ✅ Rate limiting and security headers
- ✅ Monitoring and troubleshooting guides

### Tech Stack
- **Runtime:** Node.js 20, Bun (app), TypeScript
- **Framework:** Next.js 16.2.3
- **Database:** SQLite + Drizzle ORM
- **Storage:** MinIO / S3-compatible
- **API:** Meta Graph API v20.0
- **Proxy:** Nginx
- **Containers:** Docker Compose

---

## 🔑 Key Files

### Deployment
- `docker-compose.yml` — Full stack service definitions
- `nginx.conf.template` — Web server configuration
- `deploy.sh` — Automated server setup script

### Application Context
- `AGENTS.md` — Architecture and project guidelines (for AI agents)
- `CLAUDE.md` — Claude-specific instructions
- `package.json` — Dependencies and scripts

### Environment
- `.env.local` — Local development variables
- `.env.production` — Production secrets (in /data/app/)

---

## 🚀 API Endpoints

All endpoints documented in [docs/technical/TECHNICAL_REFERENCE.md](./docs/technical/TECHNICAL_REFERENCE.md#api-endpoints)

**Posts:**
```
POST /api/posts              Create post
GET /api/posts/list          List posts (filtered)
GET /api/posts/[id]          Get single post
```

**Accounts:**
```
GET /api/accounts            List accounts
```

**Jobs:**
```
GET /api/jobs                List jobs (with summary)
```

**Media:**
```
POST /api/media/upload       Upload media file
GET /api/media/serve/[key]   Download media (local mode)
```

**Development:**
```
GET /api/test-db             Seed test data (dev-only)
```

---

## 🗄️ Database Schema

4 main tables:
- `accounts` — Connected Meta accounts (Facebook Pages, Instagram Business)
- `posts` — Posts with scheduling and status
- `media` — Media files associated with posts
- `jobs` — Background job queue with status tracking

See [docs/technical/TECHNICAL_REFERENCE.md#database-schema](./docs/technical/TECHNICAL_REFERENCE.md#database-schema-sqlite) for details.

---

## 🔄 Job Processing

The worker process polls the database every 3 seconds for due jobs:

```
1. Lock job atomically (prevents duplicates)
2. Fetch post, media, and account data
3. Validate requirements (tokens, IDs, media)
4. Call Meta Graph API (Facebook or Instagram)
5. Update post/job status
6. On error: Apply retry backoff (3 attempts max)
```

See [docs/technical/TECHNICAL_REFERENCE.md#worker-job-processing-flow](./docs/technical/TECHNICAL_REFERENCE.md#worker-job-processing-flow) for details.

---

## 💾 Storage

### Local Mode (Development)
```
MINIO_STORAGE_MODE=local
Files stored in: ./storage/media/
URLs: /api/media/serve/{key}
```

### Production Mode (S3-Compatible)
```
MINIO_STORAGE_MODE=minio
Supports: AWS S3, MinIO, DigitalOcean Spaces
URLs: Presigned (7-day expiry)
```

---

## 🔒 Security

- SSL/TLS encryption (TLSv1.2+)
- Rate limiting (DDoS protection)
- File validation (size, type)
- Atomic job locking (no duplicates)
- Presigned URLs (time-limited access)
- Security headers (HSTS, CSP, XSS protection)
- Directory traversal prevention

---

## 📊 System Requirements

### Development
- Node.js 20+
- npm/bun
- 2GB RAM
- SQLite support

### Production
- Ubuntu 20.04 LTS or later
- Docker and Docker Compose
- 4GB+ RAM
- 20GB+ disk space
- Domain with SSL support

---

## 🛠️ Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Run production server
npm run lint             # Run ESLint
npm run worker           # Start worker process
npm run worker:dev       # Start worker in watch mode
```

### Docker
```bash
docker-compose up -d                      # Start services
docker-compose logs -f metalab-app        # View app logs
docker-compose logs -f metalab-worker     # View worker logs
docker-compose exec metalab-app sqlite3 /app/db.sqlite  # DB access
docker-compose down                       # Stop services
```

### Database
```bash
# Access SQLite
docker-compose exec metalab-app sqlite3 /app/db.sqlite

# Check job status
SELECT status, COUNT(*) FROM jobs GROUP BY status;

# List accounts
SELECT id, platform, name FROM accounts;

# Force job retry
UPDATE jobs SET status='pending', lockedAt=NULL WHERE id='job-id';
```

---

## 📖 Next Steps

### For Deployment
1. Read [docs/devops/DEPLOYMENT_QUICKSTART.md](./docs/devops/DEPLOYMENT_QUICKSTART.md)
2. Run deployment script: `sudo bash deploy.sh domain.com`
3. Configure environment files
4. Start Docker Compose

### For Development
1. Read [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)
2. Run `npm install && npm run dev`
3. API docs: [docs/technical/TECHNICAL_REFERENCE.md](./docs/technical/TECHNICAL_REFERENCE.md#api-endpoints)

### For Frontend Development
1. Read [docs/design/UI_DESIGN_SPEC.md](./docs/design/UI_DESIGN_SPEC.md)
2. API reference: [docs/technical/TECHNICAL_REFERENCE.md](./docs/technical/TECHNICAL_REFERENCE.md#api-endpoints)
3. Testing: [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)

---

## 🆘 Support

### Common Issues
- **Deployment questions?** → [docs/devops/DEVOPS_GUIDE.md](./docs/devops/DEVOPS_GUIDE.md#troubleshooting)
- **Technical questions?** → [docs/technical/TECHNICAL_REFERENCE.md](./docs/technical/TECHNICAL_REFERENCE.md#supporttroubleshooting)
- **Development help?** → [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)

### Documentation
- 📖 [Complete Documentation Index](./docs/README.md)
- 🔧 [DevOps Documentation](./docs/devops/README.md)
- 💻 [Technical Documentation](./docs/technical/README.md)
- 🎨 [Design Documentation](./docs/design/README.md)

---

## 📋 Project Status

### Completed ✅
- Backend API (9 endpoints)
- Database schema (4 tables)
- Meta Graph API integration
- Job queue and worker
- MinIO storage integration
- Docker Compose setup
- Nginx configuration
- Automated deployment
- Comprehensive documentation

### In Progress ⏳
- Hardening auth/session configuration for production
- Replacing static media page mock data with live media list API
- Adding deeper UI workflows (post detail/edit actions)

### Planned 🔮
- User authentication
- Token refresh automation
- Post analytics
- Carousel/album support
- Webhook-based execution
- PostgreSQL support

---

## 📄 License

[Your License Here]

---

## 👥 Contributing

[Contributing Guidelines]

---

**Last Updated:** 2026-04-16
**Status:** Production Ready ✅

For detailed information, see [docs/README.md](./docs/README.md)
