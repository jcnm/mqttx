# 🔧 Docker Build Fixes Applied

## Issues Fixed

### Issue 1: Missing Lockfile
The `docker-compose up -d` command was failing with:
```
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH  Cannot proceed with the frozen installation
```

**Root Cause**: The Dockerfiles were using `pnpm install --frozen-lockfile` which requires a `pnpm-lock.yaml` file to exist.

### Issue 2: Invalid Package Versions
Build was failing with:
```
ERR_PNPM_NO_MATCHING_VERSION  No matching version found for aedes@^0.51.4
The latest release of aedes is "0.51.3".
```

**Root Cause**: Some packages specified versions that don't exist in npm registry.

## Solutions Applied

### Fix 1: Lockfile Issue

1. **Updated `docker/Dockerfile.broker`**:
   - Changed `pnpm install --frozen-lockfile` → `pnpm install --no-frozen-lockfile`
   - Removed `pnpm-lock.yaml*` from COPY commands

2. **Updated `docker/Dockerfile.ui`**:
   - Changed `pnpm install --frozen-lockfile` → `pnpm install --no-frozen-lockfile`
   - Removed `pnpm-lock.yaml*` from COPY commands

3. **Updated `.gitignore`**:
   - Removed `pnpm-lock.yaml` from ignore list

### Fix 2: Package Version Issues

**Updated `packages/broker/package.json`**:
- `aedes`: `^0.51.4` → `^0.51.3` (latest available)
- `aedes-persistence-redis`: `^9.1.0` → `^11.0.0` (latest stable)
- `pino-pretty`: `^13.0.0` → `^13.1.0` (latest stable)

## How to Run Now

### Option 1: Docker Compose (Recommended)

```bash
# Clean any previous builds
docker-compose down -v

# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Option 2: Manual Build & Run

```bash
# Build images manually
docker compose build --no-cache

# Start services
docker compose up -d

# Check status
docker compose ps
```

### Verify Services

Once running, access:
- **MQTT Broker (TCP)**: `mqtt://localhost:1883`
- **MQTT Broker (WebSocket)**: `ws://localhost:8083`
- **REST API**: `http://localhost:3000`
- **SCADA UI**: `http://localhost:5173`
- **Prometheus**: `http://localhost:9091`
- **Grafana**: `http://localhost:3001` (admin/admin)

### Health Checks

```bash
# Check broker health
curl http://localhost:3000/health

# Check broker stats
curl http://localhost:3000/api/broker/stats

# View logs
docker-compose logs -f broker
docker-compose logs -f ui
```

## Expected Build Time

- **First build**: 5-10 minutes (downloading dependencies)
- **Subsequent builds**: 1-2 minutes (cached layers)

## Troubleshooting

### If build still fails:

1. **Clean everything**:
   ```bash
   docker-compose down -v
   docker system prune -a
   ```

2. **Rebuild from scratch**:
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **Check Docker resources**:
   - Ensure Docker has enough memory (minimum 4GB recommended)
   - Ensure enough disk space (minimum 10GB free)

### If services won't start:

1. **Check port conflicts**:
   ```bash
   # Linux/Mac
   lsof -i :1883
   lsof -i :3000
   lsof -i :5173

   # Windows
   netstat -ano | findstr :1883
   netstat -ano | findstr :3000
   netstat -ano | findstr :5173
   ```

2. **Check Redis**:
   ```bash
   docker-compose logs redis
   ```

3. **Check broker logs**:
   ```bash
   docker-compose logs broker
   ```

## Alternative: Local Development Setup

If Docker continues to have issues, you can run locally:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start Redis (in Docker)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Start broker
cd packages/broker
pnpm dev

# In another terminal, start UI
cd packages/ui
pnpm dev
```

## Files Changed

- `docker/Dockerfile.broker` - Updated pnpm install flags
- `docker/Dockerfile.ui` - Updated pnpm install flags
- `.gitignore` - Removed pnpm-lock.yaml from ignore list
- `packages/broker/package.json` - Fixed package versions

## Commits

All fixes have been committed and pushed to branch:
```
claude/sparkplug-mqtt-scada-platform-011CUodRGtU7Wh5vBkKufodA
```

**Commits**:
- `95eb61d` - Remove frozen lockfile requirement
- `2efa027` - Add Docker build fix documentation
- `4057a11` - Update package versions to match npm registry

---

**The build should now work!** 🚀

Try running:
```bash
docker-compose up -d --build
```
