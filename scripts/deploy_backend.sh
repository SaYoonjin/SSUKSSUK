#!/bin/bash
# ===========================================
# Backend Deployment Script (No Registry)
# EC2에서 직접 빌드 후 배포
# ===========================================

set -e

# Configuration
PROJECT_ROOT="/home/ubuntu/S14P11A103"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
BRANCH="${1:-master}"

echo "=========================================="
echo "Backend Deployment Started"
echo "Branch: $BRANCH"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# Navigate to project root
cd "$PROJECT_ROOT"

# Pull latest code
echo "[1/5] Pulling latest code from $BRANCH..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Stop existing backend container
echo "[2/5] Stopping existing backend container..."
docker compose -f "$COMPOSE_FILE" stop backend || true

# Rebuild backend image
echo "[3/5] Building backend image..."
docker compose -f "$COMPOSE_FILE" build --no-cache backend

# Start backend container
echo "[4/5] Starting backend container..."
docker compose -f "$COMPOSE_FILE" up -d backend

# Health check
echo "[5/5] Waiting for health check..."
sleep 10

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec backend wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health 2>/dev/null; then
        echo "=========================================="
        echo "Deployment Successful!"
        echo "Backend is healthy and running."
        echo "=========================================="
        exit 0
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Health check attempt $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done

echo "=========================================="
echo "WARNING: Health check failed after $MAX_RETRIES attempts"
echo "Please check container logs: docker logs backend"
echo "=========================================="
exit 1
