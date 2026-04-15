# Meta Lab — Documentation Index

Welcome to the Meta Lab documentation. This directory contains all guides, references, and specifications for the project.

---

## Quick Navigation

### 🚀 Getting Started

- **[DevOps QuickStart](./devops/DEPLOYMENT_QUICKSTART.md)** — 5-minute deployment guide
- **[DevOps Complete Guide](./devops/DEVOPS_GUIDE.md)** — Comprehensive deployment and operations manual

### 📚 Documentation

- **[Technical Reference](./technical/TECHNICAL_REFERENCE.md)** — System architecture, APIs, database schema
- **[Testing Guide](./TESTING_GUIDE.md)** — Local development and testing procedures
- **[UI Design Spec](./design/UI_DESIGN_SPEC.md)** — Frontend specifications and mockups

---

## Documentation Structure

```
docs/
├── devops/                          # Deployment and operations
│   ├── DEVOPS_GUIDE.md             # Comprehensive deployment guide
│   ├── DEPLOYMENT_QUICKSTART.md    # 5-minute quick start
│   └── README.md (in this dir)     # DevOps documentation index
│
├── technical/                       # Technical documentation
│   ├── TECHNICAL_REFERENCE.md      # Architecture, APIs, database
│   └── README.md (in this dir)     # Technical documentation index
│
├── design/                          # Frontend design & specifications
│   ├── UI_DESIGN_SPEC.md           # UI/UX specifications
│   └── README.md (in this dir)     # Design documentation index
│
├── TESTING_GUIDE.md                # Development and testing guide
└── README.md                        # This file
```

---

## For Different Roles

### 🔧 DevOps / System Administrators

1. Start with: **[Deployment QuickStart](./devops/DEPLOYMENT_QUICKSTART.md)**
2. Reference: **[DevOps Complete Guide](./devops/DEVOPS_GUIDE.md)**
3. Technical details: **[Technical Reference](./technical/TECHNICAL_REFERENCE.md)**

### 👨‍💻 Backend Developers

1. Start with: **[Testing Guide](./TESTING_GUIDE.md)**
2. Reference: **[Technical Reference](./technical/TECHNICAL_REFERENCE.md)**
3. Architecture: See `/AGENTS.md` in root directory

### 🎨 Frontend Developers

1. Start with: **[UI Design Spec](./design/UI_DESIGN_SPEC.md)**
2. APIs: **[Technical Reference](./technical/TECHNICAL_REFERENCE.md)** (API Endpoints section)
3. Testing: **[Testing Guide](./TESTING_GUIDE.md)**

---

## Key Files in Root Directory

These files remain in the root directory as they're critical for development and deployment:

- **AGENTS.md** — Project context and architecture (for AI agents)
- **CLAUDE.md** — Claude-specific instructions
- **docker-compose.yml** — Container orchestration
- **nginx.conf.template** — Nginx reverse proxy configuration
- **deploy.sh** — Automated deployment script
- **package.json** — Dependencies and build scripts

---

## Quick Reference

### API Endpoints

All endpoints documented in [Technical Reference - API Endpoints](./technical/TECHNICAL_REFERENCE.md#api-endpoints)

```
POST /api/posts              Create post
GET /api/posts/list          List posts (with filtering)
GET /api/posts/[id]          Get single post
GET /api/accounts            List accounts
GET /api/jobs                List jobs (with summary)
POST /api/media/upload       Upload media
GET /api/media/serve/[key]   Download media
GET /api/test-db             Seed test data (dev-only)
```

### Database Tables

- `accounts` — Connected Meta accounts (Facebook Pages, Instagram Business)
- `posts` — Posts with scheduling and status
- `media` — Media files associated with posts
- `jobs` — Background job queue with status

See [Technical Reference - Database Schema](./technical/TECHNICAL_REFERENCE.md#database-schema) for details.

### Storage Modes

- **Local** (development): Files in `./storage/media/`
- **MinIO/S3** (production): Remote S3-compatible service

See [DevOps Guide - MinIO Configuration](./devops/DEVOPS_GUIDE.md#minio-configuration)

### Environment Variables

#### Application (.env.production)
- `NODE_ENV` — `production`
- `NEXT_PUBLIC_API_URL` — Public API URL
- `META_DRY_RUN` — Dry-run mode (no real Meta API calls)
- `WORKER_POLL_INTERVAL` — Job polling interval (ms)
- `MINIO_STORAGE_MODE` — `local` or `minio`
- Meta Graph API config: `META_GRAPH_*`
- MinIO config: `MINIO_*`

#### Docker Compose (.env)
- `MINIO_ACCESS_KEY` — MinIO/S3 access key
- `MINIO_SECRET_KEY` — MinIO/S3 secret key

---

## Deployment Quick Commands

### Start Local Development
```bash
npm install
npm run dev
```

### Run Tests
```bash
# Start Docker containers
docker-compose up -d

# View logs
docker-compose logs -f metalab-app

# Stop services
docker-compose down
```

### Deploy to Production
```bash
sudo bash deploy.sh poster.yourdomain.com https://github.com/repo.git
# Follow the setup wizard
cd /data && docker-compose up -d
```

---

## What's Where

| Component | Location | Purpose |
|-----------|----------|---------|
| Backend API | `app/api/` | Next.js API routes |
| Database | `lib/db/`, `drizzle/` | Drizzle ORM setup and schema |
| Storage | `lib/minio/` | MinIO/S3 client |
| Meta API | `lib/meta/` | Facebook and Instagram publishers |
| Worker | `worker/` | Background job processor |
| Services | `lib/{posts,jobs,accounts}/` | Database service layer |
| Docker | `docker-compose.yml` | Container orchestration |
| Nginx | `nginx.conf.template` | Reverse proxy configuration |
| Deployment | `deploy.sh` | Automated setup script |

---

## Support & Troubleshooting

### Common Issues

**Worker not processing jobs?**
→ See [DevOps Guide - Troubleshooting](./devops/DEVOPS_GUIDE.md#troubleshooting)

**Media upload failing?**
→ See [Technical Reference - Monitoring](./technical/TECHNICAL_REFERENCE.md#monitoring--observability)

**SSL certificate expired?**
→ See [DevOps Guide - SSL/TLS Setup](./devops/DEVOPS_GUIDE.md#ssltls-certificate-setup)

**Database locked?**
→ See [Technical Reference - Troubleshooting](./technical/TECHNICAL_REFERENCE.md#supporttroubleshooting)

---

## Document Summaries

### DevOps Guide (1000+ lines)
Comprehensive guide covering:
- Pre-deployment checklist
- Meta Graph API setup
- MinIO configuration
- Docker Compose setup
- Nginx configuration
- SSL/TLS management
- Monitoring and alerting
- Troubleshooting
- Security hardening
- Backup strategy

### Deployment QuickStart (300+ lines)
Quick reference including:
- 5-minute quick start
- File locations
- Environment variables
- Meta Graph API quick setup
- Docker commands
- SSL setup
- Firewall configuration
- Troubleshooting tips
- Monitoring essentials

### Technical Reference (640+ lines)
Technical documentation with:
- System architecture
- API endpoints (9 total)
- Database schema (4 tables)
- Worker job flow
- Meta Graph API integration
- Storage configuration
- Security measures
- Performance metrics
- Deployment checklist

### Testing Guide (300+ lines)
Development guide including:
- Local environment setup
- Running dev server
- Testing procedures
- Database access
- Common debugging tasks

### UI Design Spec (400+ lines)
Frontend specifications with:
- 6 screen designs
- Component breakdown
- Interaction flows
- Color and typography
- Responsive design notes

---

## Version Information

- **Next.js**: 16.2.3
- **React**: 19.2.4
- **Node.js**: 20 (for worker)
- **SQLite**: Latest (better-sqlite3)
- **Drizzle ORM**: 0.45.2
- **Minio**: 8.0.0

---

## Related Root Files

- **AGENTS.md** — Project architecture and context (1400+ lines)
- **CLAUDE.md** — Agent instructions
- **README.md** — Project overview
- **docker-compose.yml** — Full stack deployment
- **nginx.conf.template** — Web server configuration
- **deploy.sh** — Automated deployment
- **.env.local** — Local environment variables

---

## Getting Help

1. **Quick questions?** Check the Quick Reference section above
2. **Deployment issues?** See [DevOps Guide](./devops/DEVOPS_GUIDE.md)
3. **Technical questions?** See [Technical Reference](./technical/TECHNICAL_REFERENCE.md)
4. **Development questions?** See [Testing Guide](./TESTING_GUIDE.md)
5. **Design questions?** See [UI Design Spec](./design/UI_DESIGN_SPEC.md)

---

**Last Updated**: 2026-04-16
**Project Status**: Production Ready ✅

For agent-specific instructions, see `/AGENTS.md` in the root directory.
