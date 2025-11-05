# 🚀 Getting Started with Sparkplug MQTT Platform

Complete guide to get the Sparkplug MQTT Platform up and running in minutes.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Manual Installation](#manual-installation)
- [Configuration](#configuration)
- [Running the Platform](#running-the-platform)
- [Testing the Setup](#testing-the-setup)
- [Development Mode](#development-mode)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required
- **Docker & Docker Compose** (for easiest setup)
  - Docker 20.10+
  - Docker Compose 2.0+

### Alternative (for manual installation)
- **Node.js** 20+ or **Bun** 1.3+
- **pnpm** 9.x (`npm install -g pnpm`)
- **Redis** 7+ (for persistence)

## Quick Start with Docker

The absolute fastest way to get started:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sparkplug-mqtt-platform
```

### 2. Copy Environment File

```bash
cp .env.example .env
```

### 3. Start Everything

```bash
docker-compose up -d
```

That's it! 🎉

### 4. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| **MQTT Broker (TCP)** | `mqtt://localhost:1883` | MQTT over TCP |
| **MQTT Broker (WS)** | `ws://localhost:8083` | MQTT over WebSocket |
| **REST API** | `http://localhost:3000` | Broker REST API |
| **SCADA UI** | `http://localhost:5173` | Web Interface |
| **Prometheus** | `http://localhost:9091` | Metrics |
| **Grafana** | `http://localhost:3001` | Dashboards (admin/admin) |

### 5. Verify Services

```bash
# Check running containers
docker-compose ps

# Check logs
docker-compose logs -f broker
docker-compose logs -f ui

# Check health
curl http://localhost:3000/health
```

### 6. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Manual Installation

For development or custom deployments:

### 1. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm@9.15.1

# Install project dependencies
pnpm install
```

### 2. Build All Packages

```bash
# Build all packages in the monorepo
pnpm build
```

This builds:
- `@sparkplug/codec` - Protocol Buffers encoder/decoder
- `@sparkplug/namespace` - Topic management
- `@sparkplug/state` - State management
- `@sparkplug/broker` - MQTT broker
- `@sparkplug/scada-core` - SCADA logic
- `@sparkplug/ui` - Web interface

### 3. Start Redis

```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Or install Redis locally
# macOS: brew install redis && brew services start redis
# Linux: sudo apt-get install redis-server && sudo systemctl start redis
```

### 4. Start the Broker

```bash
# In one terminal
cd packages/broker
pnpm start

# Or use development mode with auto-reload
pnpm dev
```

### 5. Start the UI

```bash
# In another terminal
cd packages/ui
pnpm dev
```

## Configuration

### Broker Configuration

Edit `packages/broker/config/sparkplug.yaml`:

```yaml
# Dynamic Sparkplug version
sparkplug:
  version: "spBv1.0"

# MQTT broker settings
mqtt:
  ports:
    tcp: 1883
    ws: 8083

# Enable Sparkplug Aware features
aware_broker:
  enabled: true
  birth_certificate_storage:
    enabled: true
    storage_backend: "redis"

# Enable SCADA/Primary Host
scada:
  host_application:
    enabled: true
    primary_host:
      host_id: "SCADA_PRIMARY_01"
      is_primary: true
    state_management:
      enabled: true
      publish_interval_ms: 30000
```

### Environment Variables

Edit `.env`:

```bash
# Broker
NODE_ENV=production
API_PORT=3000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# UI
VITE_BROKER_URL=ws://localhost:8083
VITE_API_URL=http://localhost:3000

# Monitoring
PROMETHEUS_PORT=9090
```

## Running the Platform

### Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d broker redis

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f broker

# Restart a service
docker-compose restart broker

# Scale services (if needed)
docker-compose up -d --scale broker=2
```

### Manual (Development)

```bash
# Terminal 1: Start Redis
docker run --rm -p 6379:6379 redis:7-alpine

# Terminal 2: Start Broker
pnpm --filter @sparkplug/broker dev

# Terminal 3: Start UI
pnpm --filter @sparkplug/ui dev
```

### Production (Manual)

```bash
# Build everything
pnpm build

# Start broker
cd packages/broker
NODE_ENV=production node dist/index.js

# Serve UI (using nginx or any static server)
cd packages/ui
npx serve -s dist -l 5173
```

## Testing the Setup

### 1. Check Broker Health

```bash
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":1234567890}
```

### 2. Check Broker Stats

```bash
curl http://localhost:3000/api/broker/stats

# Expected response:
# {
#   "totalNodes": 0,
#   "onlineNodes": 0,
#   "totalDevices": 0,
#   "onlineDevices": 0,
#   "activeSessions": 0
# }
```

### 3. Test MQTT Connection

Using `mosquitto_pub/sub`:

```bash
# Subscribe to all Sparkplug messages
mosquitto_sub -h localhost -p 1883 -t 'spBv1.0/#' -v

# Publish a test message
mosquitto_pub -h localhost -p 1883 -t 'spBv1.0/Group1/NDATA/Node1' -m 'test'
```

Using MQTT.js CLI:

```bash
# Install mqtt CLI
npm install -g mqtt

# Subscribe
mqtt sub -h localhost -p 1883 -t 'spBv1.0/#' -v

# Publish
mqtt pub -h localhost -p 1883 -t 'spBv1.0/Group1/NDATA/Node1' -m 'test'
```

### 4. Test WebSocket Connection

Open the SCADA UI at `http://localhost:5173` and check the connection indicator.

### 5. Test REST API

```bash
# List nodes
curl http://localhost:3000/api/nodes

# List devices
curl http://localhost:3000/api/devices

# Send rebirth command (example)
curl -X POST http://localhost:3000/api/rebirth \
  -H "Content-Type: application/json" \
  -d '{"groupId":"Group1","edgeNodeId":"Node1"}'
```

## Development Mode

### Watch Mode

```bash
# Watch and rebuild codec package
pnpm --filter @sparkplug/codec dev

# Watch and rebuild broker
pnpm --filter @sparkplug/broker dev

# Watch UI with hot reload
pnpm --filter @sparkplug/ui dev
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
pnpm --filter @sparkplug/codec test
```

### Linting & Formatting

```bash
# Check code style
pnpm check

# Format code
pnpm format

# Lint specific package
pnpm --filter @sparkplug/broker lint
```

## Monitoring

### Prometheus Metrics

Access Prometheus at `http://localhost:9091`

Available metrics:
- `sparkplug_messages_total` - Total Sparkplug messages
- `sparkplug_nodes_online` - Online edge nodes
- `sparkplug_devices_online` - Online devices
- `sparkplug_sequence_errors` - Sequence errors

### Grafana Dashboards

Access Grafana at `http://localhost:3001`

**Default credentials**: `admin` / `admin`

1. Add Prometheus data source:
   - URL: `http://prometheus:9090`
2. Import pre-built dashboards (if available)
3. Create custom dashboards for your metrics

### Logs

```bash
# Docker Compose logs
docker-compose logs -f broker

# Follow specific service
docker-compose logs -f --tail=100 broker

# View all logs
docker-compose logs --tail=1000

# Export logs
docker-compose logs > logs.txt
```

## Troubleshooting

### Broker Won't Start

**Issue**: Broker fails to start

```bash
# Check if ports are already in use
lsof -i :1883
lsof -i :3000
lsof -i :8083

# Kill conflicting processes
kill -9 <PID>

# Check Redis connection
redis-cli ping
```

### Redis Connection Failed

**Issue**: Broker can't connect to Redis

```bash
# Check Redis is running
docker ps | grep redis

# Check Redis connectivity
redis-cli -h localhost -p 6379 ping

# Start Redis if not running
docker run -d -p 6379:6379 redis:7-alpine
```

### UI Can't Connect to Broker

**Issue**: SCADA UI shows "Disconnected"

1. Check `VITE_BROKER_URL` in `.env`:
   ```bash
   VITE_BROKER_URL=ws://localhost:8083
   ```

2. Verify WebSocket is accessible:
   ```bash
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:8083
   ```

3. Check broker logs for WebSocket errors:
   ```bash
   docker-compose logs broker | grep -i websocket
   ```

### Build Failures

**Issue**: `pnpm build` fails

```bash
# Clean all packages
pnpm clean

# Remove node_modules
rm -rf node_modules
rm -rf packages/*/node_modules

# Reinstall dependencies
pnpm install

# Build again
pnpm build
```

### Port Conflicts

**Issue**: Port already in use

```bash
# Find process using port
lsof -ti:1883
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:1883)

# Or change port in .env
API_PORT=3001
MQTT_TCP_PORT=1884
```

### Docker Issues

**Issue**: Docker build fails

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Start fresh
docker-compose down -v
docker-compose up -d --build
```

## Next Steps

1. **Explore the UI**: Open `http://localhost:5173` and navigate through different views
2. **Test with a simulator**: Create test edge nodes and devices
3. **Check the API**: Explore REST endpoints at `http://localhost:3000/api/*`
4. **Monitor metrics**: View Prometheus at `http://localhost:9091`
5. **Customize configuration**: Edit `packages/broker/config/sparkplug.yaml`
6. **Read the docs**: Check `README.md` for architecture details

## Need Help?

- 📖 Check the [README.md](README.md) for detailed documentation
- 🐛 Report issues on GitHub
- 💬 Join our community Discord
- 📧 Email support@example.com

---

**Happy building! 🚀**
