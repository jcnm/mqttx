# 🚀 Sparkplug MQTT Platform

**Production-grade, web-based MQTT broker with integrated SCADA UI**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://reactjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.1-000000.svg)](https://www.fastify.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 Overview

A complete **ISO/IEC 20237:2023** implementation of the **Sparkplug B** specification, providing:

- ✅ **Sparkplug Compliant MQTT Broker** (Mandatory features)
- ✅ **Sparkplug Aware Broker** (Optional features)
- ✅ **Primary Host Application / SCADA** (Complete features)
- ✅ **Modern Web UI** with real-time visualization
- ✅ **Production-ready** with clustering & telemetry

### 🎯 Key Features

#### Sparkplug Compliant Broker (Mandatory)
- [x] MQTT 3.1.1 & 5.0 full support
- [x] QoS 0, 1, 2
- [x] Retained messages
- [x] Last Will & Testament (LWT)
- [x] Clean Session / Clean Start enforcement
- [x] Wildcard subscriptions (+, #)

#### Sparkplug Aware Broker (Optional)
- [x] NBIRTH/DBIRTH message storage
- [x] Certificate topics (`$sparkplug/certificates/...`)
- [x] NDEATH timestamp update on disconnect
- [x] bdSeq validation
- [x] seq validation (0-255 ordering)
- [x] Node & device state tracking
- [x] Heartbeat monitoring

#### Primary Host Application / SCADA
- [x] STATE message publishing (JSON format)
- [x] Birth certificate monitoring
- [x] Auto-discovery of nodes & devices
- [x] NCMD/DCMD sending
- [x] Rebirth command support
- [x] NDATA/DDATA subscription
- [x] Report by Exception (RBE) detection
- [x] Store & Forward
- [x] Multi-broker support

#### SCADA Web UI
- [x] Real-time namespace visualization
- [x] Interactive dashboard
- [x] Node & device monitoring
- [x] Command panel (NCMD/DCMD)
- [x] Message viewer
- [x] Modern React 19 + Tailwind CSS 4

## 🏗️ Architecture

```
sparkplug-mqtt-platform/
├── packages/
│   ├── broker/          # MQTT Broker (Fastify + Aedes)
│   ├── codec/           # Sparkplug Protocol Buffers encoder/decoder
│   ├── namespace/       # Topic parsing, building, validation
│   ├── state/           # bdSeq, seq, session management
│   ├── scada-core/      # Primary Host Application logic
│   └── ui/              # SCADA Web UI (React 19 + Tailwind 4)
├── docker/              # Docker configurations
└── config/              # YAML configurations
```

## 💻 Technology Stack

### Backend
- **Runtime**: Bun 1.3+ / Node.js 23+
- **Framework**: Fastify 5.1+
- **MQTT**: Aedes 0.51+, MQTT.js 5.10+
- **Codec**: Protocol Buffers (protobufjs 7.4+)
- **Storage**: Redis (ioredis 5.4+), SQLite (better-sqlite3 11.7+)
- **Telemetry**: OpenTelemetry, Prometheus, Pino

### Frontend
- **Framework**: React 19.0
- **Build**: Vite 6.0+
- **Styling**: Tailwind CSS 4.0
- **State**: Zustand 5.0+, TanStack Query 5.62+
- **Visualization**: React Flow 12.3+, Recharts 2.15+

### DevOps
- **Package Manager**: pnpm 9.x
- **Monorepo**: Turbo
- **Linting/Formatting**: Biome 1.9+
- **Containerization**: Docker + Docker Compose

## 🚀 Quick Start

See **[GETSTARTED.md](GETSTARTED.md)** for detailed setup instructions.

### TL;DR

```bash
# 1. Clone repository
git clone <repo-url>
cd sparkplug-mqtt-platform

# 2. Copy environment file
cp .env.example .env

# 3. Start with Docker Compose
docker-compose up -d

# 4. Access services
# - MQTT Broker: mqtt://localhost:1883
# - WebSocket: ws://localhost:8083
# - REST API: http://localhost:3000
# - SCADA UI: http://localhost:5173
# - Prometheus: http://localhost:9091
# - Grafana: http://localhost:3001
```

## 📖 Documentation

### Configuration

The broker is configured via `packages/broker/config/sparkplug.yaml`:

```yaml
sparkplug:
  version: "spBv1.0"  # Dynamic version support

mqtt:
  ports:
    tcp: 1883
    ws: 8083

aware_broker:
  enabled: true
  birth_certificate_storage:
    enabled: true

scada:
  host_application:
    enabled: true
    primary_host:
      host_id: "SCADA_PRIMARY_01"
```

### API Endpoints

#### Broker Stats
```bash
GET http://localhost:3000/api/broker/stats
```

#### List Nodes
```bash
GET http://localhost:3000/api/nodes
GET http://localhost:3000/api/nodes/online
GET http://localhost:3000/api/nodes/:groupId/:edgeNodeId
```

#### List Devices
```bash
GET http://localhost:3000/api/devices
GET http://localhost:3000/api/devices/:groupId/:edgeNodeId
```

#### Send Commands
```bash
POST http://localhost:3000/api/command/node
POST http://localhost:3000/api/command/device
POST http://localhost:3000/api/rebirth
```

### Sparkplug Topics

```
# Node Birth
spBv1.0/{group_id}/NBIRTH/{edge_node_id}

# Node Data
spBv1.0/{group_id}/NDATA/{edge_node_id}

# Node Command
spBv1.0/{group_id}/NCMD/{edge_node_id}

# Device Birth
spBv1.0/{group_id}/DBIRTH/{edge_node_id}/{device_id}

# Device Data
spBv1.0/{group_id}/DDATA/{edge_node_id}/{device_id}

# STATE (Primary Host)
spBv1.0/STATE/{host_id}

# Birth Certificates (Aware Broker)
$sparkplug/certificates/spBv1.0/{group_id}/NBIRTH/{edge_node_id}
$sparkplug/certificates/spBv1.0/{group_id}/DBIRTH/{edge_node_id}/{device_id}
```

## 🔧 Development

### Prerequisites
- Node.js 20+ or Bun 1.3+
- pnpm 9.x
- Docker & Docker Compose (for full stack)
- Redis (for persistence)

### Local Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start broker in development mode
pnpm --filter @sparkplug/broker dev

# Start UI in development mode
pnpm --filter @sparkplug/ui dev

# Run tests
pnpm test

# Lint & format
pnpm check
```

### Package Development

```bash
# Work on specific package
cd packages/codec
pnpm dev

# Build specific package
pnpm --filter @sparkplug/codec build

# Test specific package
pnpm --filter @sparkplug/namespace test
```

## 📦 Packages

### @sparkplug/codec
Sparkplug B Protocol Buffers encoder/decoder with compression support.

```typescript
import { encodePayload, decodePayload, createNBirthPayload } from '@sparkplug/codec';

const payload = createNBirthPayload(Date.now(), 0n, metrics);
const encoded = encodePayload(payload, { compress: true });
const decoded = decodePayload(encoded, { decompress: true });
```

### @sparkplug/namespace
Topic parsing, building, and validation.

```typescript
import { parseTopic, buildNodeBirthTopic, validateTopic } from '@sparkplug/namespace';

const parsed = parseTopic('spBv1.0/Group1/NBIRTH/Node1');
const topic = buildNodeBirthTopic({ groupId: 'Group1', edgeNodeId: 'Node1' });
```

### @sparkplug/state
State management for bdSeq, seq, and sessions.

```typescript
import { StateManager } from '@sparkplug/state';

const stateManager = new StateManager();
stateManager.setNodeOnline('Group1', 'Node1', 0n);
const node = stateManager.getNode('Group1', 'Node1');
```

### @sparkplug/scada-core
Primary Host Application logic.

```typescript
import { PrimaryHostApplication } from '@sparkplug/scada-core';

const host = new PrimaryHostApplication({
  brokerUrl: 'mqtt://localhost:1883',
  hostId: 'SCADA_01',
});

await host.connect();
```

## 🔒 Security

- TLS/SSL support for MQTT connections
- Helmet.js for HTTP security headers
- Rate limiting on REST API
- CORS configuration
- Input validation with Ajv

## 📊 Monitoring

### Prometheus Metrics
- `sparkplug_messages_total` - Total messages processed
- `sparkplug_nodes_online` - Number of online nodes
- `sparkplug_devices_online` - Number of online devices
- `sparkplug_sequence_errors` - Sequence validation errors

### Grafana Dashboards
Access Grafana at `http://localhost:3001` (default credentials: admin/admin)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
pnpm --filter @sparkplug/codec test
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Eclipse Tahu](https://github.com/eclipse/tahu) - Reference implementation
- [ISO/IEC 20237:2023](https://www.iso.org/standard/67237.html) - Sparkplug specification
- [Aedes](https://github.com/moscajs/aedes) - MQTT broker
- [Fastify](https://www.fastify.io/) - Web framework
- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## 📞 Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our server](https://discord.gg/example)
- 🐛 Issues: [GitHub Issues](https://github.com/example/sparkplug-mqtt/issues)
- 📖 Docs: [Full Documentation](https://docs.example.com)

## 🗺️ Roadmap

- [ ] Sparkplug TCK compliance testing
- [ ] Advanced SCADA widgets
- [ ] Historical data playback
- [ ] Alarm management system
- [ ] Multi-tenancy support
- [ ] Kubernetes deployment
- [ ] Edge node simulator
- [ ] Performance benchmarks

---

**Built with ❤️ using modern TypeScript, React 19, and Tailwind CSS 4**
