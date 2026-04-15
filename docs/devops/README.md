# DevOps Documentation

All deployment, operations, and infrastructure documentation is located here.

---

## 📖 Guides

### Quick Start (Recommended First Read)
**[DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)** — 300+ lines

Get up and running in 5 minutes. Includes:
- Quick start checklist
- Environment configuration
- Docker commands
- SSL setup
- Troubleshooting quick fixes
- Performance tuning

**Start here if you're:** Deploying for the first time, need quick answers

---

### Comprehensive Guide (Detailed Reference)
**[DEVOPS_GUIDE.md](./DEVOPS_GUIDE.md)** — 1000+ lines

Complete deployment and operations manual. Includes:
- Pre-deployment checklist (infrastructure, API, domain, DB, security)
- Meta Graph API setup (Facebook Pages, Instagram Business, tokens)
- MinIO configuration (local, AWS S3, self-hosted)
- Docker Compose detailed setup
- Nginx configuration with SSL/TLS
- Certificate management (Let's Encrypt, self-signed)
- Deployment workflow (initial, ongoing, updates)
- Monitoring and alerting
- Troubleshooting guide with solutions
- Security hardening checklist
- Backup strategy
- Scaling considerations

**Reference when you need:** Detailed instructions, troubleshooting, production setup

---

## 🏗️ Infrastructure Overview

### Service Stack
```
Nginx (80/443)
    ↓ Reverse proxy, SSL/TLS, rate limiting
Next.js App (3000)
    ├─ API endpoints
    └─ Media upload/download
    
SQLite Database
    └─ Posts, jobs, media, accounts

Worker Process (Node.js)
    └─ Job executor with Meta API integration

MinIO/S3 Storage
    └─ Media file storage
```

### Deployment Architecture
```
Docker Compose
├─ metalab-app (Next.js)
├─ metalab-worker (Node.js)
├─ nginx (Reverse proxy)
└─ minio (Optional, self-hosted storage)
```

---

## 📋 Quick Reference

### File Locations (Docker)
```
/data/
├── app/                    # Application code and database
│   ├── db.sqlite          # SQLite database (persistent)
│   ├── storage/media/     # Local media (if MINIO_STORAGE_MODE=local)
│   └── .env.production    # Production secrets
├── nginx/
│   ├── conf.d/metalab.conf
│   └── certs/
│       ├── metalab.crt
│       └── metalab.key
└── minio/data/            # MinIO storage (if self-hosted)
```

### Storage Modes

| Mode | Use Case | URL Format |
|------|----------|-----------|
| `local` | Development | `/api/media/serve/{key}` |
| `minio` | Production | S3 presigned URL (7-day expiry) |

### Environment Variables

**For Production** (`/data/app/.env.production`):
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://poster.yourdomain.com
META_DRY_RUN=false
MINIO_STORAGE_MODE=minio
MINIO_ENDPOINT=minio.example.com
MINIO_ACCESS_KEY=your-key
MINIO_SECRET_KEY=your-secret
```

**For Docker Compose** (`/data/.env`):
```env
MINIO_ACCESS_KEY=your-key
MINIO_SECRET_KEY=your-secret
```

---

## 🚀 Common Tasks

### Deploy New Server
```bash
# 1. Run deployment script
sudo bash deploy.sh poster.yourdomain.com https://github.com/repo.git

# 2. Edit environment files
nano /data/app/.env.production
nano /data/.env

# 3. Start services
cd /data && docker-compose up -d

# 4. Verify
curl https://poster.yourdomain.com/api/accounts
```

**More details:** See [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md#quick-start-5-minutes)

### Update Application
```bash
cd /data/app
git fetch origin && git checkout main
npm install && npm run build
cd /data && docker-compose restart metalab-app
```

### View Logs
```bash
cd /data
docker-compose logs -f metalab-app        # Application logs
docker-compose logs -f metalab-worker     # Worker logs
docker-compose logs --tail=50 metalab-app # Last 50 lines
```

### Access Database
```bash
docker-compose exec metalab-app sqlite3 /app/db.sqlite
```

### Check Job Status
```bash
curl https://poster.yourdomain.com/api/jobs?summary=true
```

### Renew SSL Certificate
```bash
certbot renew --force-renewal
sudo cp /etc/letsencrypt/live/domain.com/fullchain.pem /data/nginx/certs/metalab.crt
sudo cp /etc/letsencrypt/live/domain.com/privkey.pem /data/nginx/certs/metalab.key
docker exec metalab-nginx nginx -s reload
```

---

## ⚠️ Troubleshooting

### Worker not processing jobs
```bash
docker-compose logs metalab-worker
docker-compose restart metalab-worker
```

**More solutions:** See [DEVOPS_GUIDE.md - Troubleshooting](./DEVOPS_GUIDE.md#troubleshooting)

### API not responding
```bash
docker-compose ps
curl http://localhost:3000/api/accounts
docker-compose logs metalab-app
```

### Media upload failing
```bash
# Check storage mode
docker-compose exec metalab-app echo $MINIO_STORAGE_MODE

# Check MinIO connectivity
curl https://minio.example.com
```

### Database locked
```bash
docker-compose exec metalab-app sqlite3 /app/db.sqlite \
  "SELECT * FROM jobs WHERE status='running' AND lockedAt < (strftime('%s', 'now') * 1000) - 30000"

# Force unlock if needed
docker-compose exec metalab-app sqlite3 /app/db.sqlite \
  "UPDATE jobs SET status='pending', lockedAt=NULL WHERE id='job-id'"
```

---

## 🔒 Security Checklist

- [ ] Enable SSL/TLS (Let's Encrypt recommended)
- [ ] Configure firewall (allow 22, 80, 443 only)
- [ ] Use strong passwords for MinIO/system
- [ ] Set proper file permissions (chmod 600 for .env)
- [ ] Disable debug mode in production (`NODE_ENV=production`)
- [ ] Keep Docker images updated
- [ ] Enable SSH key-based authentication only
- [ ] Set up automated backups
- [ ] Configure monitoring/alerting

See [DEVOPS_GUIDE.md - Security Hardening](./DEVOPS_GUIDE.md#security-hardening) for details.

---

## 📊 Monitoring

### Key Metrics to Track

**Job Processing:**
```bash
docker-compose exec metalab-app sqlite3 /app/db.sqlite \
  "SELECT status, COUNT(*) FROM jobs GROUP BY status"
```

**Failed Posts:**
```bash
docker-compose exec metalab-app sqlite3 /app/db.sqlite \
  "SELECT id, error FROM posts WHERE status='failed' ORDER BY createdAt DESC"
```

**Token Expiry:**
```bash
docker-compose exec metalab-app sqlite3 /app/db.sqlite \
  "SELECT name, (tokenExpiresAt - strftime('%s', 'now') * 1000) / 86400000 as days_until_expiry FROM accounts"
```

**Disk Usage:**
```bash
du -sh /data/*
```

---

## 🆘 Getting Help

1. **Quick deployment questions?** → [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)
2. **Detailed setup instructions?** → [DEVOPS_GUIDE.md](./DEVOPS_GUIDE.md)
3. **Troubleshooting?** → [DEVOPS_GUIDE.md - Troubleshooting](./DEVOPS_GUIDE.md#troubleshooting)
4. **Technical architecture?** → [../technical/TECHNICAL_REFERENCE.md](../technical/TECHNICAL_REFERENCE.md)

---

**Last Updated:** 2026-04-16
**Status:** Production Ready ✅

For other documentation, see:
- [Technical Reference](../technical/TECHNICAL_REFERENCE.md) — System architecture and APIs
- [Testing Guide](../TESTING_GUIDE.md) — Development and testing
- [Design Specs](../design/UI_DESIGN_SPEC.md) — Frontend specifications
