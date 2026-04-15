# Meta Lab — DevOps & Deployment Guide

## Overview

This guide covers everything needed to deploy Meta Lab on a self-hosted Ubuntu server with Docker/Podman, including Meta Graph API setup, MinIO configuration, Nginx reverse proxy, and production hardening.

---

## Pre-Deployment Checklist

### 1. Infrastructure Requirements

- [ ] Ubuntu 20.04 LTS or later
- [ ] Docker Engine or Podman installed
- [ ] Docker Compose or Podman Compose available
- [ ] Nginx installed (or available via container)
- [ ] Domain name with DNS records pointing to server
- [ ] 4GB+ RAM
- [ ] 20GB+ disk space (includes SQLite, media storage)
- [ ] SSL certificate (Let's Encrypt recommended)

### 2. Meta Graph API Setup

**Facebook Pages:**
- [ ] Create Facebook App at https://developers.facebook.com/
  - Go to My Apps → Create App → Business type
- [ ] Add Facebook Login product
- [ ] Add Messenger product
- [ ] Generate **Page Access Token** (long-lived, ~60 days expiry):
  - Go to Tools → Access Token Debugger
  - Or use Graph API Explorer: `GET /me/accounts`
  - Long-lived tokens: Set expiry in token settings
- [ ] Retrieve **Page ID** for each Facebook Page:
  - Use Graph API: `GET /{page-name}`
  - Or find in Page Settings → Page Info → Page ID
- [ ] Add Test Page (if using sandbox)
- [ ] Store tokens securely (we'll add to .env)

**Instagram Business:**
- [ ] Ensure Instagram account is Business or Creator account (not personal)
- [ ] Link to Facebook Page
- [ ] Generate **Instagram Business Account ID** (igUserId):
  - Use Graph API: `GET /me/instagram_business_account`
- [ ] Retrieve **User Access Token** (same as Facebook):
  - Tokens have 60-day expiry by default
  - Can request long-lived tokens (valid up to 5,184,000 seconds)
- [ ] Enable graph API access for Instagram
- [ ] Store igUserId and token securely

**Token Management:**
- [ ] Document where tokens are stored (secure vault or .env in production)
- [ ] Set up token refresh process (manual for now, or via cron job)
- [ ] Create monitoring for token expiry

### 3. MinIO Setup (Production)

**Option A: Hosted MinIO (AWS S3-compatible)**
- [ ] Create AWS S3 bucket or use MinIO cloud service
- [ ] Create IAM user with S3 bucket access
- [ ] Generate **Access Key** and **Secret Key**
- [ ] Enable versioning (optional, for backups)
- [ ] Set lifecycle policies for media cleanup
- [ ] Document bucket name and region

**Option B: Self-Hosted MinIO**
- [ ] Deploy MinIO container or standalone service
- [ ] Configure persistent storage (e.g., `/data/minio`)
- [ ] Set admin username and password
- [ ] Create dedicated bucket for media
- [ ] Enable SSL/TLS (self-signed or Let's Encrypt)
- [ ] Set up monitoring and alerting
- [ ] Document access credentials

### 4. Domain & SSL Setup

- [ ] Register domain name
- [ ] Configure DNS records pointing to server IP:
  - `poster.yourdomain.com` → server_ip (or use `metalab.yourdomain.com`)
- [ ] Obtain SSL certificate:
  - [ ] Option A: Let's Encrypt (automated)
  - [ ] Option B: Self-signed (for testing)
- [ ] Place certificate and key in `/etc/ssl/certs/` (or container-friendly path)

### 5. Database Setup

- [ ] Decide: SQLite file storage location (`/data/db/` recommended)
- [ ] Set up volume mounts in Docker Compose
- [ ] Plan backup strategy:
  - [ ] Daily backups of db.sqlite
  - [ ] Store in separate location or S3

### 6. Environment Configuration

- [ ] Create production `.env.production` file with:
  - Meta Graph API tokens
  - MinIO credentials
  - Domain configuration
  - Worker settings
- [ ] Secure this file (not in git, restricted permissions)

---

## Meta Graph API Configuration

### Environment Variables

```env
# Meta Graph API
META_GRAPH_BASE_URL=https://graph.facebook.com
META_GRAPH_VERSION=v20.0
META_GRAPH_TIMEOUT=30000

# Dry-run mode (set to false in production to enable real publishing)
META_DRY_RUN=false
```

### Account Setup in Database

Accounts must be manually added to SQLite before publishing. Example SQL:

```sql
-- Facebook Page
INSERT INTO accounts (id, platform, name, pageId, igUserId, accessToken, tokenExpiresAt)
VALUES (
  'fb-page-1',
  'facebook',
  'My Facebook Page',
  '123456789',  -- Page ID from Meta
  NULL,
  'EAABsbCS...', -- Page Access Token
  1712345678901  -- Expiry timestamp (or 0 for never)
);

-- Instagram Business
INSERT INTO accounts (id, platform, name, pageId, igUserId, accessToken, tokenExpiresAt)
VALUES (
  'ig-business-1',
  'instagram',
  'My Instagram Business',
  NULL,
  '987654321',  -- Instagram User ID
  'IGAABsbCS...', -- User Access Token
  1712345678901
);
```

### Token Refresh Strategy

**For Manual Setup (Current):**
1. Before token expires, regenerate via Meta developers dashboard
2. Update `accounts.accessToken` and `tokenExpiresAt` in SQLite
3. No downtime required

**For Future Automation:**
- Implement token refresh endpoint
- Use Graph API to refresh tokens before expiry
- Update DB automatically via background job

---

## MinIO Configuration

### Environment Variables

```env
# Local development mode (default)
MINIO_STORAGE_MODE=local

# Production with MinIO/S3
MINIO_STORAGE_MODE=minio
MINIO_ENDPOINT=minio.example.com        # Or s3.amazonaws.com
MINIO_PORT=443                           # 9000 for self-hosted
MINIO_USE_SSL=true                       # false if using self-signed
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_REGION=us-east-1
MINIO_BUCKET=media
```

### Bucket Lifecycle Policy (Optional)

Clean up old media files after 90 days (edit as needed):

```json
{
  "Rules": [
    {
      "ID": "delete-old-media",
      "Status": "Enabled",
      "Filter": { "Prefix": "posts/" },
      "Expiration": { "Days": 90 }
    }
  ]
}
```

Apply via AWS CLI or MinIO client:
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket media \
  --lifecycle-configuration file://policy.json \
  --endpoint-url https://minio.example.com
```

---

## Docker & Container Setup

### Directory Structure

```
/data/
  ├── app/                    # Application directory
  │   ├── db.sqlite          # SQLite database (persistent)
  │   ├── storage/
  │   │   └── media/         # Local media storage (if using MINIO_STORAGE_MODE=local)
  │   └── .env.production    # Production environment variables
  ├── minio/                 # MinIO data (if self-hosted)
  │   └── data/
  └── nginx/
      ├── conf.d/
      │   └── metalab.conf   # Nginx config
      └── certs/             # SSL certificates
          ├── metalab.crt
          └── metalab.key
```

### Docker Compose Setup

**File: `docker-compose.yml`**

```yaml
version: '3.9'

services:
  # Next.js Application (API + UI)
  metalab-app:
    image: node:20-alpine
    container_name: metalab-app
    working_dir: /app
    volumes:
      - /data/app:/app
      - /data/app/node_modules:/app/node_modules  # Prevent volume override
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://poster.yourdomain.com
      META_GRAPH_BASE_URL: https://graph.facebook.com
      META_GRAPH_VERSION: v20.0
      META_DRY_RUN: "false"
      MINIO_STORAGE_MODE: minio  # or 'local'
      MINIO_ENDPOINT: minio.example.com
      MINIO_PORT: 443
      MINIO_USE_SSL: "true"
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_REGION: us-east-1
      MINIO_BUCKET: media
    ports:
      - "127.0.0.1:3000:3000"
    command: npm start
    restart: unless-stopped
    depends_on:
      - metalab-worker

  # Worker Process (Job Executor)
  metalab-worker:
    image: node:20-alpine
    container_name: metalab-worker
    working_dir: /app
    volumes:
      - /data/app:/app
      - /data/app/node_modules:/app/node_modules
    environment:
      NODE_ENV: production
      WORKER_POLL_INTERVAL: 3000
      WORKER_MAX_CONCURRENT: 3
      META_DRY_RUN: "false"
      MINIO_STORAGE_MODE: minio
      MINIO_ENDPOINT: minio.example.com
      MINIO_PORT: 443
      MINIO_USE_SSL: "true"
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_REGION: us-east-1
      MINIO_BUCKET: media
    command: npx tsx worker/index.ts
    restart: unless-stopped

  # Optional: MinIO (Self-hosted S3-compatible storage)
  # Uncomment if self-hosting MinIO instead of using AWS S3
  # minio:
  #   image: minio/minio
  #   container_name: metalab-minio
  #   environment:
  #     MINIO_ROOT_USER: ${MINIO_ROOT_USER}
  #     MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
  #   volumes:
  #     - /data/minio/data:/data
  #   ports:
  #     - "127.0.0.1:9000:9000"
  #     - "127.0.0.1:9001:9001"  # Console
  #   command: server /data --console-address ":9001"
  #   restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: metalab-nginx
    volumes:
      - /data/nginx/conf.d:/etc/nginx/conf.d:ro
      - /data/nginx/certs:/etc/nginx/certs:ro
      - /data/nginx/html:/usr/share/nginx/html:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - metalab-app
    restart: unless-stopped

networks:
  default:
    name: metalab-network
```

**File: `.env` (for Docker Compose, not in git)**

```env
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=your-secure-password
```

### Build & Deploy

1. **Prepare server:**
   ```bash
   mkdir -p /data/{app,nginx/{conf.d,certs},minio/data}
   cd /data/app
   git clone <repository> .
   bun install  # or npm install
   npm run build
   ```

2. **Set up environment:**
   ```bash
   cp .env.production /data/app/.env.production
   # Edit with production values
   ```

3. **Start containers:**
   ```bash
   cd /data
   docker-compose up -d
   docker-compose logs -f  # View logs
   ```

4. **Verify:**
   ```bash
   docker-compose ps
   curl http://localhost:3000/api/accounts  # Check API
   ```

---

## Nginx Configuration

### File: `/data/nginx/conf.d/metalab.conf`

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name poster.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl;
    server_name poster.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/nginx/certs/metalab.crt;
    ssl_certificate_key /etc/nginx/certs/metalab.key;

    # SSL best practices
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;
    gzip_min_length 1024;

    # Proxy to Next.js app
    location / {
        proxy_pass http://metalab-app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;  # For streaming/real-time features
    }

    # Rate limiting for API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://metalab-app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Media endpoint (cache aggressively)
    location /api/media/serve/ {
        proxy_pass http://metalab-app:3000;
        proxy_cache_valid 200 365d;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        add_header Cache-Control "public, max-age=31536000";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

### Nginx Startup

```bash
# Test configuration
docker exec metalab-nginx nginx -t

# Reload after changes
docker exec metalab-nginx nginx -s reload
```

---

## SSL/TLS Certificate Setup

### Option A: Let's Encrypt (Automated)

Using Certbot in container:

```bash
docker run --rm -it \
  -v /data/nginx/certs:/etc/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d poster.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos --no-eff-email
```

Then in docker-compose, set up auto-renewal:

```bash
# Add to crontab
0 3 * * * docker run --rm -it \
  -v /data/nginx/certs:/etc/letsencrypt \
  certbot/certbot renew --quiet && \
  docker exec metalab-nginx nginx -s reload
```

### Option B: Self-Signed (Testing)

```bash
openssl req -x509 -newkey rsa:2048 \
  -keyout /data/nginx/certs/metalab.key \
  -out /data/nginx/certs/metalab.crt \
  -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Org/CN=poster.yourdomain.com"
```

---

## Deployment Workflow

### Initial Setup

1. Provision Ubuntu server
2. Install Docker/Podman and Nginx
3. Set up DNS records
4. Create data directories: `/data/{app,nginx,minio}`
5. Generate SSL certificates (Let's Encrypt or self-signed)
6. Clone Meta Lab repository
7. Create `.env.production` with all secrets
8. Run `npm install` and `npm run build`
9. Start Docker Compose: `docker-compose up -d`
10. Verify with `curl https://poster.yourdomain.com/api/accounts`

### Ongoing Operations

**Daily Checks:**
- Monitor logs: `docker-compose logs -f metalab-app`
- Check job status: `curl https://poster.yourdomain.com/api/jobs?summary=true`
- Monitor disk space for media

**Weekly Tasks:**
- Review worker errors: `SELECT * FROM jobs WHERE status = 'failed' ORDER BY updatedAt DESC`
- Check token expiry: `SELECT id, tokenExpiresAt FROM accounts WHERE tokenExpiresAt < NOW()`
- Back up SQLite: `cp /data/app/db.sqlite /backup/db-$(date +%Y%m%d).sqlite`

**Monthly Tasks:**
- Token refresh (if expiring within 30 days)
- Update Docker images: `docker-compose pull && docker-compose up -d`
- Review MinIO lifecycle policies

**Quarterly Tasks:**
- Security audit of Nginx config
- Review and update SSL certificates
- Test database backup/restore

### Updates & Deployment

```bash
cd /data/app

# Pull latest code
git fetch origin
git checkout main

# Rebuild
npm install
npm run build

# Restart containers
cd /data
docker-compose up -d

# Verify
docker-compose logs -f metalab-app
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Job Status:**
   ```sql
   SELECT status, COUNT(*) as count FROM jobs GROUP BY status;
   ```

2. **Publishing Failures:**
   ```sql
   SELECT id, error, attempts FROM posts WHERE status = 'failed' ORDER BY createdAt DESC LIMIT 10;
   ```

3. **Worker Uptime:**
   ```bash
   docker ps | grep metalab-worker
   ```

4. **Disk Usage:**
   ```bash
   du -sh /data/*
   ```

5. **Token Expiry:**
   ```sql
   SELECT name, tokenExpiresAt, (tokenExpiresAt - strftime('%s', 'now') * 1000) / 86400000 as days_until_expiry FROM accounts;
   ```

### Automated Alerts

Set up systemd timer or cron job to check every hour:

```bash
#!/bin/bash
# /usr/local/bin/metalab-health-check.sh

DOCKER_CONTAINER="metalab-worker"
HEALTH_URL="https://poster.yourdomain.com/api/jobs?summary=true"

# Check worker running
if ! docker ps | grep -q "$DOCKER_CONTAINER"; then
    echo "ALERT: Worker container not running" | mail -s "MetaLab Alert" admin@yourdomain.com
fi

# Check API responsive
if ! curl -s "$HEALTH_URL" > /dev/null; then
    echo "ALERT: API not responding" | mail -s "MetaLab Alert" admin@yourdomain.com
fi

# Check job failures
FAILED_JOBS=$(sqlite3 /data/app/db.sqlite "SELECT COUNT(*) FROM jobs WHERE status = 'failed'")
if [ "$FAILED_JOBS" -gt 5 ]; then
    echo "ALERT: $FAILED_JOBS failed jobs" | mail -s "MetaLab Alert" admin@yourdomain.com
fi
```

---

## Troubleshooting

### Common Issues

**Problem: Worker not processing jobs**
```bash
# Check logs
docker logs metalab-worker

# Verify DB accessible
docker exec metalab-app sqlite3 /app/db.sqlite "SELECT COUNT(*) FROM jobs"

# Check token validity
docker exec metalab-app sqlite3 /app/db.sqlite "SELECT id, accessToken FROM accounts LIMIT 1"
```

**Problem: Media upload failing**
```bash
# Check MinIO connectivity
curl https://minio.example.com

# Verify credentials
MINIO_ENDPOINT=minio.example.com \
MINIO_ACCESS_KEY=... \
MINIO_SECRET_KEY=... \
  mc ls minio/media

# Check bucket exists
docker exec metalab-app node -e "console.log(process.env.MINIO_BUCKET)"
```

**Problem: SSL certificate expired**
```bash
# Check expiry
openssl x509 -enddate -noout -in /data/nginx/certs/metalab.crt

# Renew with certbot
docker run --rm -it -v /data/nginx/certs:/etc/letsencrypt \
  certbot/certbot renew --force-renewal

# Reload nginx
docker exec metalab-nginx nginx -s reload
```

**Problem: Database locked**
```sql
-- Check for running transactions
SELECT * FROM jobs WHERE status = 'running' AND lockedAt < (strftime('%s', 'now') * 1000) - 30000;

-- Force unlock (if safe)
UPDATE jobs SET status = 'pending', lockedAt = NULL WHERE id = 'job-id-here';
```

---

## Security Hardening

### Required Steps

- [ ] Enable SSL/TLS (Let's Encrypt or self-signed)
- [ ] Configure firewall:
  ```bash
  sudo ufw allow 22
  sudo ufw allow 80
  sudo ufw allow 443
  sudo ufw enable
  ```
- [ ] Restrict SSH access (key-based only, no root login)
- [ ] Use strong passwords for MinIO and system
- [ ] Store `.env.production` with restricted permissions (0600)
- [ ] Disable debug mode in production (`NODE_ENV=production`)
- [ ] Keep Docker images updated: `docker pull node:20-alpine`
- [ ] Use read-only root filesystem if possible

### Backup Strategy

- [ ] Daily SQLite backups to separate storage or S3
- [ ] Keep 30 days of backups
- [ ] Test restore process monthly
- [ ] Back up SSL certificates separately

---

## Scaling Considerations (Future)

- **Multi-worker setup:** Run multiple worker containers with shared SQLite
- **Database migration:** Move to PostgreSQL if scaling beyond SQLite limits
- **Reverse proxy cluster:** Use HAProxy or AWS ALB for load balancing
- **Queue system:** Consider Redis if job volume increases significantly
- **Observability:** Add Prometheus + Grafana for metrics

---

## Environment Variable Reference

### Production `.env.production`

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://poster.yourdomain.com

# Meta Graph API
META_GRAPH_BASE_URL=https://graph.facebook.com
META_GRAPH_VERSION=v20.0
META_GRAPH_TIMEOUT=30000
META_DRY_RUN=false

# Worker
WORKER_POLL_INTERVAL=3000
WORKER_MAX_CONCURRENT=3

# MinIO
MINIO_STORAGE_MODE=minio
MINIO_ENDPOINT=minio.example.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=<your-key>
MINIO_SECRET_KEY=<your-secret>
MINIO_REGION=us-east-1
MINIO_BUCKET=media
```

---

## Support & Documentation

- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Docker Compose:** https://docs.docker.com/compose/
- **Nginx:** https://nginx.org/en/docs/
- **Meta Graph API:** https://developers.facebook.com/docs/graph-api
- **MinIO:** https://min.io/docs/

---

## Appendix: Quick Reference Commands

```bash
# View all containers
docker-compose ps

# View logs
docker-compose logs -f <service>

# SSH into container
docker-compose exec <service> sh

# Restart service
docker-compose restart <service>

# View environment
docker-compose config

# Check database
docker-compose exec metalab-app sqlite3 /app/db.sqlite

# List jobs
docker-compose exec metalab-app \
  sqlite3 /app/db.sqlite "SELECT id, status, runAt FROM jobs LIMIT 10"

# Force job rerun
docker-compose exec metalab-app \
  sqlite3 /app/db.sqlite \
  "UPDATE jobs SET status='pending', lockedAt=NULL WHERE id='job-id'"

# Clean up old containers/images
docker system prune -a --volumes
```

---

Last Updated: 2026-04-16
Next Review: 2026-07-16
