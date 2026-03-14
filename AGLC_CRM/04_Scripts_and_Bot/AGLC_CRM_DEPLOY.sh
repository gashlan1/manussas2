#!/bin/bash
# AGLC CRM One-Click Deployment Script
# Copy and paste this entire script into your terminal

set -e

echo "🚀 AGLC CRM Deployment Starting..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Install prerequisites
echo -e "${BLUE}[1/8] Installing prerequisites...${NC}"
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs postgresql-client git
sudo npm install -g pnpm@10.4.1
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Clone repositories
echo -e "${BLUE}[2/8] Cloning repositories...${NC}"
mkdir -p ~/projects/aglc
cd ~/projects/aglc
gh repo clone aglc-crm
cd aglc-crm

# 3. Create environment file
echo -e "${BLUE}[3/8] Creating environment configuration...${NC}"
cat > .env.local << 'ENVEOF'
DATABASE_URL=postgresql://aglc_user:aglc_password_dev@localhost:5432/aglc_crm_dev
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
JWT_SECRET=your_jwt_secret_min_32_chars
NODE_ENV=development
PORT=3000
ENVEOF

# 4. Create docker-compose.yml
echo -e "${BLUE}[4/8] Creating Docker configuration...${NC}"
cat > docker-compose.yml << 'DOCKEREOF'
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: aglc-crm-postgres
    environment:
      POSTGRES_USER: aglc_user
      POSTGRES_PASSWORD: aglc_password_dev
      POSTGRES_DB: aglc_crm_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aglc_user"]
      interval: 10s
      timeout: 5s
      retries: 5
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: aglc-crm-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@aglc.com
      PGADMIN_DEFAULT_PASSWORD: admin_password_dev
    ports:
      - "5050:80"
    depends_on:
      - postgres
volumes:
  postgres_data:
networks:
  default:
    name: aglc-crm-network
DOCKEREOF

# 5. Start Docker services
echo -e "${BLUE}[5/8] Starting Docker containers...${NC}"
docker-compose up -d
sleep 5

# 6. Install dependencies
echo -e "${BLUE}[6/8] Installing Node.js dependencies...${NC}"
pnpm install

# 7. Run database migrations
echo -e "${BLUE}[7/8] Running database migrations...${NC}"
pnpm db:push

# 8. Build project
echo -e "${BLUE}[8/8] Building project...${NC}"
pnpm build

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📍 Access Points:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend API: http://localhost:3000"
echo "  - Database: localhost:5432"
echo "  - pgAdmin: http://localhost:5050"
echo ""
echo "🚀 Start development server:"
echo "  cd ~/projects/aglc/aglc-crm"
echo "  pnpm dev"
echo ""
echo "🛑 Stop services:"
echo "  docker-compose down"
echo ""

