#!/bin/bash
# Meta Lab Deployment Script
# This script automates the initial setup and deployment of Meta Lab on a production server

set -e  # Exit on error

COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${COLOR_BLUE}=== Meta Lab Deployment Script ===${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo -e "${COLOR_RED}This script must be run as root${NC}"
   exit 1
fi

# Configuration
DATA_DIR="/data"
DOMAIN="${1:-poster.yourdomain.com}"
REPO_URL="${2:-https://github.com/yourusername/meta-lab.git}"

echo -e "${COLOR_YELLOW}Configuration:${NC}"
echo "  Data Directory: $DATA_DIR"
echo "  Domain: $DOMAIN"
echo "  Repository: $REPO_URL"
echo ""

# Step 1: Create directory structure
echo -e "${COLOR_BLUE}Step 1: Creating directory structure...${NC}"
mkdir -p "$DATA_DIR"/{app,nginx/{conf.d,certs,html},minio/data}
echo -e "${COLOR_GREEN}✓ Directories created${NC}\n"

# Step 2: Check Docker
echo -e "${COLOR_BLUE}Step 2: Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${COLOR_RED}✗ Docker not found. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${COLOR_GREEN}✓ Docker is installed$(docker --version)${NC}\n"

# Step 3: Check Docker Compose
echo -e "${COLOR_BLUE}Step 3: Checking Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${COLOR_RED}✗ Docker Compose not found. Please install it first.${NC}"
    exit 1
fi
echo -e "${COLOR_GREEN}✓ Docker Compose is installed$(docker-compose --version)${NC}\n"

# Step 4: Clone repository
echo -e "${COLOR_BLUE}Step 4: Cloning repository...${NC}"
if [ -d "$DATA_DIR/app/.git" ]; then
    echo -e "${COLOR_YELLOW}Repository already exists. Updating...${NC}"
    cd "$DATA_DIR/app"
    git pull origin main
else
    git clone "$REPO_URL" "$DATA_DIR/app"
fi
echo -e "${COLOR_GREEN}✓ Repository cloned/updated${NC}\n"

# Step 5: Set up environment file
echo -e "${COLOR_BLUE}Step 5: Setting up environment...${NC}"
cd "$DATA_DIR/app"

if [ ! -f ".env.production" ]; then
    echo -e "${COLOR_YELLOW}Creating .env.production${NC}"
    cat > .env.production << EOF
# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://$DOMAIN

# Meta Graph API
META_GRAPH_BASE_URL=https://graph.facebook.com
META_GRAPH_VERSION=v20.0
META_GRAPH_TIMEOUT=30000
META_DRY_RUN=false

# Worker Configuration
WORKER_POLL_INTERVAL=3000
WORKER_MAX_CONCURRENT=3

# MinIO Configuration
# Set to 'local' for local storage or 'minio' for S3-compatible
MINIO_STORAGE_MODE=minio
MINIO_ENDPOINT=minio.example.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=change-me
MINIO_SECRET_KEY=change-me
MINIO_REGION=us-east-1
MINIO_BUCKET=media
EOF
    
    echo -e "${COLOR_YELLOW}⚠ .env.production created. Please edit it with your credentials:${NC}"
    echo "  nano $DATA_DIR/app/.env.production"
    echo ""
    read -p "Press Enter once you've edited the file..."
else
    echo -e "${COLOR_YELLOW}✓ .env.production already exists${NC}"
fi
chmod 600 .env.production
echo -e "${COLOR_GREEN}✓ Environment file secured${NC}\n"

# Step 6: Generate SSL certificate
echo -e "${COLOR_BLUE}Step 6: Setting up SSL certificate...${NC}"
if [ ! -f "$DATA_DIR/nginx/certs/metalab.crt" ]; then
    echo -e "${COLOR_YELLOW}Generating self-signed certificate (for testing)${NC}"
    openssl req -x509 -newkey rsa:2048 \
      -keyout "$DATA_DIR/nginx/certs/metalab.key" \
      -out "$DATA_DIR/nginx/certs/metalab.crt" \
      -days 365 -nodes \
      -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    echo -e "${COLOR_YELLOW}⚠ Self-signed certificate created. For production, use Let's Encrypt:${NC}"
    echo "  certbot certonly --standalone -d $DOMAIN"
else
    echo -e "${COLOR_GREEN}✓ SSL certificate already exists${NC}"
fi
chmod 600 "$DATA_DIR/nginx/certs/metalab.key"
echo ""

# Step 7: Set up Nginx config
echo -e "${COLOR_BLUE}Step 7: Configuring Nginx...${NC}"
cp "$DATA_DIR/app/nginx.conf.template" "$DATA_DIR/nginx/conf.d/metalab.conf"
sed -i "s/poster.yourdomain.com/$DOMAIN/g" "$DATA_DIR/nginx/conf.d/metalab.conf"
echo -e "${COLOR_GREEN}✓ Nginx configured${NC}\n"

# Step 8: Build application
echo -e "${COLOR_BLUE}Step 8: Building application...${NC}"
cd "$DATA_DIR/app"
npm install
npm run build
echo -e "${COLOR_GREEN}✓ Application built${NC}\n"

# Step 9: Create docker-compose .env
echo -e "${COLOR_BLUE}Step 9: Creating Docker Compose environment...${NC}"
cat > "$DATA_DIR/.env" << EOF
MINIO_ACCESS_KEY=change-me
MINIO_SECRET_KEY=change-me
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=change-me-secure
EOF
chmod 600 "$DATA_DIR/.env"
echo -e "${COLOR_YELLOW}⚠ Edit $DATA_DIR/.env with your MinIO credentials${NC}"
echo -e "${COLOR_YELLOW}Then start services with: docker-compose up -d${NC}\n"

# Step 10: Display next steps
echo -e "${COLOR_GREEN}=== Setup Complete ===${NC}\n"
echo -e "${COLOR_BLUE}Next Steps:${NC}"
echo "1. Edit .env files with production credentials:"
echo "   - $DATA_DIR/app/.env.production (Meta API tokens, MinIO config)"
echo "   - $DATA_DIR/.env (Docker Compose environment)"
echo ""
echo "2. Copy docker-compose.yml to /data:"
echo "   cp $DATA_DIR/app/docker-compose.yml $DATA_DIR/"
echo ""
echo "3. Start services:"
echo "   cd $DATA_DIR"
echo "   docker-compose up -d"
echo ""
echo "4. Verify installation:"
echo "   docker-compose logs -f metalab-app"
echo "   curl https://$DOMAIN/api/accounts"
echo ""
echo "5. Set up firewall:"
echo "   ufw allow 22,80,443/tcp"
echo "   ufw enable"
echo ""
echo "6. Configure SSL with Let's Encrypt (optional):"
echo "   certbot certonly --webroot -w /data/nginx/html -d $DOMAIN"
echo "   docker exec metalab-nginx nginx -s reload"
echo ""
echo -e "${COLOR_YELLOW}For more information, see DEVOPS_GUIDE.md${NC}\n"
