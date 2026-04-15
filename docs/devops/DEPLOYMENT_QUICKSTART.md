# DevOps Deployment Guide - Quick Start

This document provides a quick-start guide for deploying Meta Lab on a production server.

## Quick Start (5 minutes)

### 1. Prepare Your Server

```bash
# Ubuntu 20.04 LTS or later
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose nginx
sudo usermod -aG docker $(whoami)
```

### 2. Run Deployment Script

```bash
sudo bash deploy.sh poster.yourdomain.com https://github.com/yourusername/meta-lab.git
```

### 3. Configure Credentials

Edit the environment files:

```bash
# Meta API tokens and MinIO config
nano /data/app/.env.production

# Docker Compose environment
nano /data/.env
```

### 4. Start Services

```bash
cd /data
docker-compose up -d
```

### 5. Verify Installation

```bash
# Check logs
docker-compose logs -f metalab-app

# Test API
curl https://poster.yourdomain.com/api/accounts
```

## Detailed Setup

See **DEVOPS_GUIDE.md** for:
- Complete pre-deployment checklist
- Meta Graph API configuration
- MinIO setup (local or cloud)
- SSL/TLS certificate management
- Nginx configuration details
- Database backup strategy
- Monitoring and troubleshooting
- Security hardening

## File Locations

After deployment, files are organized as:

```
/data/
├── app/                          # Application code
│   ├── db.sqlite                # SQLite database
│   ├── storage/media/           # Local media storage (if MINIO_STORAGE_MODE=local)
│   ├── .env.production          # Production environment
│   ├── node_modules/            # Dependencies
│   └── ...
├── nginx/
│   ├── conf.d/metalab.conf      # Nginx config
│   ├── certs/                   # SSL certificates
│   └── html/                    # Static files
├── minio/data/                  # MinIO data (if self-hosted)
├── .env                         # Docker Compose environment
└── docker-compose.yml           # Container orchestration
```

## Environment Variables

### Application (.env.production)

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://poster.yourdomain.com
META_GRAPH_BASE_URL=https://graph.facebook.com
META_GRAPH_VERSION=v20.0
META_DRY_RUN=false
WORKER_POLL_INTERVAL=3000
WORKER_MAX_CONCURRENT=3
MINIO_STORAGE_MODE=minio
MINIO_ENDPOINT=minio.example.com
MINIO_ACCESS_KEY=your-key
MINIO_SECRET_KEY=your-secret
```

### Docker Compose (.env)

```env
MINIO_ACCESS_KEY=your-key
MINIO_SECRET_KEY=your-secret
```

## Meta Graph API Setup

### Facebook Pages

1. Create app: https://developers.facebook.com/
2. Get Page ID: Use Graph API `/me/accounts`
3. Generate Page Access Token: In app settings
4. Store in database:
   ```sql
   INSERT INTO accounts (id, platform, name, pageId, accessToken)
   VALUES ('fb-page-1', 'facebook', 'My Page', '123456', 'token...');
   ```

### Instagram Business

1. Link Instagram to Facebook Page
2. Get Business Account ID: `/me/instagram_business_account`
3. Generate User Access Token (same as Facebook token)
4. Store in database:
   ```sql
   INSERT INTO accounts (id, platform, name, igUserId, accessToken)
   VALUES ('ig-1', 'instagram', 'My IG', '987654', 'token...');
   ```

## Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f metalab-app

# Check status
docker-compose ps

# Restart service
docker-compose restart metalab-app

# Stop all
docker-compose down

# Access database
docker-compose exec metalab-app sqlite3 /app/db.sqlite
```

## SSL Certificate

### Let's Encrypt (Recommended)

```bash
# Obtain certificate
sudo certbot certonly --webroot -w /data/nginx/html -d poster.yourdomain.com

# Copy to container volume
sudo cp /etc/letsencrypt/live/poster.yourdomain.com/fullchain.pem /data/nginx/certs/metalab.crt
sudo cp /etc/letsencrypt/live/poster.yourdomain.com/privkey.pem /data/nginx/certs/metalab.key

# Reload nginx
docker exec metalab-nginx nginx -s reload

# Auto-renew (add to crontab)
0 3 * * * certbot renew --quiet && docker exec metalab-nginx nginx -s reload
```

### Self-Signed (Testing Only)

```bash
openssl req -x509 -newkey rsa:2048 \
  -keyout /data/nginx/certs/metalab.key \
  -out /data/nginx/certs/metalab.crt \
  -days 365 -nodes \
  -subj "/CN=poster.yourdomain.com"
```

## Firewall Setup

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Database Access

### List Jobs

```bash
docker-compose exec metalab-app sqlite3 /app/db.sqlite \
  "SELECT id, status, runAt FROM jobs LIMIT 10"
```

### Check Accounts

```bash
docker-compose exec metalab-app sqlite3 /app/db.sqlite \
  "SELECT id, platform, name FROM accounts"
```

### Force Retry Failed Job

```bash
docker-compose exec metalab-app sqlite3 /app/db.sqlite \
  "UPDATE jobs SET status='pending', lockedAt=NULL WHERE id='job-id'"
```

## Troubleshooting

### Worker not running

```bash
docker-compose logs metalab-worker
docker-compose restart metalab-worker
```

### API not responding

```bash
docker-compose logs metalab-app
docker-compose ps
curl http://localhost:3000/api/accounts
```

### Media upload failing

```bash
# Check MinIO connectivity
curl https://minio.example.com

# Check storage mode
docker-compose exec metalab-app echo $MINIO_STORAGE_MODE
```

### Database locked

```bash
# Check for stuck jobs
docker-compose exec metalab-app sqlite3 /app/db.sqlite \
  "SELECT * FROM jobs WHERE status='running' AND lockedAt < (strftime('%s', 'now') * 1000) - 30000"

# Force unlock if needed
docker-compose exec metalab-app sqlite3 /app/db.sqlite \
  "UPDATE jobs SET status='pending', lockedAt=NULL WHERE id='job-id'"
```

## Monitoring

### Check Job Status

```bash
curl https://poster.yourdomain.com/api/jobs?summary=true
```

### View Failed Posts

```bash
docker-compose exec metalab-app sqlite3 /app/db.sqlite \
  "SELECT id, error FROM posts WHERE status='failed' ORDER BY createdAt DESC"
```

### Check Disk Usage

```bash
du -sh /data/*
du -sh /data/app/storage/media/
```

## Backup Strategy

### Daily Backup

```bash
#!/bin/bash
BACKUP_DIR="/backup"
mkdir -p $BACKUP_DIR
cp /data/app/db.sqlite $BACKUP_DIR/db-$(date +%Y%m%d).sqlite
# Keep 30 days
find $BACKUP_DIR -name "db-*.sqlite" -mtime +30 -delete
```

### Add to Crontab

```bash
0 2 * * * /usr/local/bin/backup-metalab.sh
```

## Updates & Maintenance

### Update Application

```bash
cd /data/app
git fetch origin
git checkout main
npm install
npm run build
docker-compose restart metalab-app
```

### Update Docker Images

```bash
cd /data
docker-compose pull
docker-compose up -d
```

### View Logs

```bash
# Recent logs
docker-compose logs --tail=50 metalab-app

# Follow logs
docker-compose logs -f metalab-app

# Specific timeframe
docker-compose logs --since 10m metalab-app
```

## Security Hardening

- [ ] Enable SSL/TLS (Let's Encrypt)
- [ ] Configure firewall to allow only 22, 80, 443
- [ ] Use strong passwords for MinIO
- [ ] Restrict .env file permissions (chmod 600)
- [ ] Disable debug mode in production
- [ ] Keep Docker images updated
- [ ] Set up SSH key-based authentication only
- [ ] Use read-only root filesystem if possible

## Performance Tuning

```bash
# Increase worker concurrency if needed
# Edit /data/app/.env.production
WORKER_MAX_CONCURRENT=5

# Adjust poll interval (lower = more frequent checks)
WORKER_POLL_INTERVAL=2000

# Restart worker
docker-compose restart metalab-worker
```

## Support

For detailed information on:
- Meta Graph API: https://developers.facebook.com/docs/graph-api
- MinIO: https://min.io/docs
- Nginx: https://nginx.org/en/docs/
- Docker: https://docs.docker.com/

See **DEVOPS_GUIDE.md** for comprehensive deployment documentation.

---

Last Updated: 2026-04-16
