#!/bin/bash
# Meta Lab Deployment Script
# Dockerfile-based deployment using docker compose

set -e

COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${COLOR_BLUE}=== Meta Lab Deployment Script ===${NC}\n"

if [ "$EUID" -ne 0 ]; then
  echo -e "${COLOR_RED}This script must be run as root${NC}"
  exit 1
fi

APP_DIR="${1:-/opt/metalab}"
DOMAIN="${2:-poster.yourdomain.com}"
REPO_URL="${3:-https://github.com/yourusername/meta-lab.git}"

echo -e "${COLOR_YELLOW}Configuration:${NC}"
echo "  Install Dir: $APP_DIR"
echo "  Domain: $DOMAIN"
echo "  Repository: $REPO_URL"
echo ""

# Step 1: Check Docker + Compose
echo -e "${COLOR_BLUE}Step 1: Checking Docker...${NC}"
command -v docker >/dev/null || { echo -e "${COLOR_RED}Docker not found${NC}"; exit 1; }
echo -e "${COLOR_GREEN}✓ Docker found${NC}\n"

echo -e "${COLOR_BLUE}Step 2: Checking Docker Compose...${NC}"
docker compose version >/dev/null 2>&1 || docker-compose --version >/dev/null 2>&1 || {
  echo -e "${COLOR_RED}Docker Compose not found${NC}"; exit 1
}
echo -e "${COLOR_GREEN}✓ Docker Compose found${NC}\n"

# Step 3: Clone / pull repository
echo -e "${COLOR_BLUE}Step 3: Cloning repository...${NC}"
mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  echo -e "${COLOR_YELLOW}Updating existing repository...${NC}"
  git -C "$APP_DIR" pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
fi
echo -e "${COLOR_GREEN}✓ Repository ready${NC}\n"

# Step 4: Create .env if missing
echo -e "${COLOR_BLUE}Step 4: Setting up environment...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" << EOF
NODE_ENV=production
APP_URL=https://$DOMAIN
PORT=3000

META_GRAPH_BASE_URL=https://graph.facebook.com
META_GRAPH_VERSION=v20.0
META_GRAPH_TIMEOUT=30000
META_DRY_RUN=false

WORKER_POLL_INTERVAL=3000
WORKER_MAX_CONCURRENT=3

# Storage: 'local' serves media via Next.js; 'minio' uses S3-compatible storage
MINIO_STORAGE_MODE=local
EOF
  chmod 600 "$APP_DIR/.env"
  echo -e "${COLOR_YELLOW}⚠ Created $APP_DIR/.env — edit it with your credentials${NC}"
  read -p "  Press Enter after editing..."
fi
echo -e "${COLOR_GREEN}✓ Environment configured${NC}\n"

# Step 5: Build and start
echo -e "${COLOR_BLUE}Step 5: Building Docker image...${NC}"
docker compose -f "$APP_DIR/docker-compose.yml" build
echo -e "${COLOR_GREEN}✓ Build complete${NC}\n"

echo -e "${COLOR_BLUE}Step 6: Starting services...${NC}"
docker compose -f "$APP_DIR/docker-compose.yml" up -d
echo -e "${COLOR_GREEN}✓ Services started${NC}\n"

# Summary
echo -e "${COLOR_GREEN}=== Setup Complete ===${NC}\n"
echo -e "${COLOR_BLUE}Services:${NC}"
echo "  App + Worker:  http://localhost:3000"
echo "  Public URL:    https://$DOMAIN"
echo ""
echo -e "${COLOR_BLUE}Commands:${NC}"
echo "  Logs:    docker compose -f $APP_DIR/docker-compose.yml logs -f"
echo "  Restart: docker compose -f $APP_DIR/docker-compose.yml restart"
echo "  Update:  git -C $APP_DIR pull && docker compose -f $APP_DIR/docker-compose.yml up -d --build"
echo ""
