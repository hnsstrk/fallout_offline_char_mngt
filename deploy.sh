#!/bin/bash
#
# Deployment Script for Fallout Character Manager
# Usage: ./deploy.sh
#
# This script automates the deployment process on the production server.
# It assumes you're running this ON the server where the app is deployed.
#

set -e  # Exit on error

echo "=========================================="
echo "Fallout Character Manager - Deployment"
echo "=========================================="
echo ""

# Configuration
PROJECT_DIR="/var/www/fallout_offline_char_mngt"
FRONTEND_TARGET="/var/www/fallout-char-manager"
BACKEND_NAME="fallout-backend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on server
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: Project directory not found at $PROJECT_DIR${NC}"
    echo "This script should be run on the production server."
    exit 1
fi

cd "$PROJECT_DIR"

# Pull latest code
echo -e "${YELLOW}[1/6] Pulling latest code from GitHub...${NC}"
git pull origin main

# Backup database
echo -e "${YELLOW}[2/6] Creating database backup...${NC}"
mkdir -p backups
BACKUP_FILE="backups/backup-$(date +%Y%m%d-%H%M%S).sql"
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U fallout_prod fallout_char_manager > "$BACKUP_FILE"
echo -e "${GREEN}✓ Backup saved to: $BACKUP_FILE${NC}"

# Update Backend
echo -e "${YELLOW}[3/6] Building backend...${NC}"
cd backend
npm install --production
npm run build
cd ..

# Restart Backend
echo -e "${YELLOW}[4/6] Restarting backend service...${NC}"
if pm2 describe "$BACKEND_NAME" > /dev/null 2>&1; then
    pm2 restart "$BACKEND_NAME"
    echo -e "${GREEN}✓ Backend restarted${NC}"
else
    echo -e "${RED}Warning: PM2 process '$BACKEND_NAME' not found${NC}"
    echo "Start it manually with: pm2 start backend/dist/server.js --name $BACKEND_NAME"
fi

# Update Frontend
echo -e "${YELLOW}[5/6] Building frontend...${NC}"
cd frontend
npm install
npm run build

# Deploy Frontend
echo -e "Deploying frontend to $FRONTEND_TARGET..."
sudo mkdir -p "$FRONTEND_TARGET"
sudo cp -r dist/* "$FRONTEND_TARGET/"
cd ..
echo -e "${GREEN}✓ Frontend deployed${NC}"

# Reload nginx
echo -e "${YELLOW}[6/6] Reloading nginx...${NC}"
sudo nginx -t && sudo systemctl reload nginx
echo -e "${GREEN}✓ nginx reloaded${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment completed successfully!"
echo "==========================================${NC}"
echo ""
echo "Services status:"
pm2 status "$BACKEND_NAME" || echo "Backend not managed by PM2"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "Latest backup: $BACKUP_FILE"
echo ""
