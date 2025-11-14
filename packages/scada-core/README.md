# @sparkplug/scada-core

Core components for building Sparkplug B Primary Host (SCADA) applications compliant with ISO/IEC 20237:2023.

## Overview

This package provides essential building blocks for implementing Sparkplug B Primary Host applications, including:

- **Primary Host Application**: Complete SCADA host implementation with STATE management
- **State Publisher**: Periodic STATE message publishing
- **Command Sender**: NCMD/DCMD command transmission
- **Birth Monitor**: NBIRTH/DBIRTH message monitoring
- **Data Subscriber**: Subscribe to Edge Node data
- **Store & Forward**: Message persistence and replay

## Installation

```bash
pnpm add @sparkplug/scada-core
```

## Quick Start

### Primary Host Application

```typescript
import { PrimaryHostApplication } from '@sparkplug/scada-core';

const host = new PrimaryHostApplication({
  brokerUrl: 'mqtt://localhost:1883',
  hostId: 'ScadaHost1',
  namespace: 'spBv1.0',
  publishInterval: 30000, // STATE publish interval (ms)
});

await host.connect();

// The host automatically:
// - Publishes online STATE with LWT configured
// - Subscribes to all NBIRTH and DBIRTH messages
// - Periodically publishes STATE to maintain presence

// Graceful shutdown
await host.disconnect();
```

### State Publisher

```typescript
import { StatePublisher } from '@sparkplug/scada-core';
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883');

const statePublisher = new StatePublisher({
  client,
  hostId: 'ScadaHost1',
  namespace: 'spBv1.0',
  publishInterval: 30000,
});

statePublisher.start();

// Manual state publish
statePublisher.publish(true); // ONLINE
statePublisher.publish(false); // OFFLINE

statePublisher.stop();
```

### Command Sender

Send commands to Edge Nodes and Devices:

```typescript
import { CommandSender } from '@sparkplug/scada-core';
import { DataType } from '@sparkplug/codec';
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883');
const sender = new CommandSender(client);

// Send Node Command (NCMD)
await sender.sendNodeCommand({
  groupId: 'Group1',
  edgeNodeId: 'Node1',
  metrics: [
    {
      name: 'SetPoint',
      datatype: DataType.Float,
      value: 75.5,
    },
  ],
});

// Send Device Command (DCMD)
await sender.sendDeviceCommand({
  groupId: 'Group1',
  edgeNodeId: 'Node1',
  deviceId: 'Device1',
  metrics: [
    {
      name: 'Enable',
      datatype: DataType.Boolean,
      value: true,
    },
  ],
});

// Request Node Rebirth
await sender.requestRebirth('Group1', 'Node1');
```

### Birth Monitor

Monitor NBIRTH and DBIRTH messages:

```typescript
import { BirthMonitor } from '@sparkplug/scada-core';
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883');

const monitor = new BirthMonitor({
  client,
  namespace: 'spBv1.0',
  onNodeBirth: (groupId, edgeNodeId, payload) => {
    console.log(`Node ${groupId}/${edgeNodeId} came online`);
    console.log(`bdSeq: ${payload.seq}`);
  },
  onDeviceBirth: (groupId, edgeNodeId, deviceId, payload) => {
    console.log(`Device ${groupId}/${edgeNodeId}/${deviceId} came online`);
  },
});

monitor.start();
```

### Data Subscriber

Subscribe to Edge Node data:

```typescript
import { DataSubscriber } from '@sparkplug/scada-core';
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883');

const subscriber = new DataSubscriber({
  client,
  groupId: 'Group1',
  edgeNodeId: 'Node1',
  onMessage: (topic, payload) => {
    console.log(`Received data from ${topic}`);
    payload.metrics?.forEach((metric) => {
      console.log(`${metric.name}: ${metric.value}`);
    });
  },
});

subscriber.start();
```

### Store & Forward

Persist messages when connection is lost:

```typescript
import { StoreAndForward } from '@sparkplug/scada-core';

const store = new StoreAndForward({
  maxStoredMessages: 1000,
  storageDir: './sparkplug-store',
});

store.start();

// Messages are automatically stored when offline
// and replayed when connection is restored
```

## API Reference

### PrimaryHostApplication

#### Constructor Options

- `brokerUrl: string` - MQTT broker URL
- `hostId: string` - Unique Primary Host identifier
- `namespace?: string` - Sparkplug namespace (default: 'spBv1.0')
- `publishInterval?: number` - STATE publish interval in ms (default: 30000)

#### Methods

- `connect(): Promise<void>` - Connect to MQTT broker
- `disconnect(): Promise<void>` - Graceful disconnect with offline STATE
- `getClient(): MqttClient | null` - Get MQTT client instance
- `isOnline(): boolean` - Check connection status
- `getHostId(): string` - Get host identifier

### StatePublisher

#### Constructor Options

- `client: MqttClient` - MQTT client instance
- `hostId: string` - Primary Host identifier
- `namespace?: string` - Sparkplug namespace (default: 'spBv1.0')
- `publishInterval?: number` - Publish interval in ms (default: 30000)

#### Methods

- `start(): void` - Start periodic STATE publishing
- `stop(): void` - Stop publishing and send offline STATE
- `publish(online: boolean): void` - Manually publish STATE

### CommandSender

#### Constructor

- `constructor(client: MqttClient, namespace?: string)`

#### Methods

- `sendNodeCommand(options: NodeCommandOptions): Promise<void>`
- `sendDeviceCommand(options: DeviceCommandOptions): Promise<void>`
- `requestRebirth(groupId: string, edgeNodeId: string): Promise<void>`

### BirthMonitor

#### Constructor Options

- `client: MqttClient` - MQTT client instance
- `namespace?: string` - Sparkplug namespace (default: 'spBv1.0')
- `onNodeBirth?: (groupId, edgeNodeId, payload) => void`
- `onDeviceBirth?: (groupId, edgeNodeId, deviceId, payload) => void`

#### Methods

- `start(): void` - Start monitoring birth messages
- `stop(): void` - Stop monitoring

## Architecture

### Primary Host Requirements (ISO/IEC 20237:2023)

The Primary Host Application implements all required behaviors:

1. **STATE Management**
   - Online/Offline STATE messages
   - Last Will & Testament (LWT) configuration
   - Periodic STATE publishing

2. **Birth Certificate Tracking**
   - Subscribe to all NBIRTH and DBIRTH messages
   - Track Edge Node online/offline status
   - Monitor birth/death sequence numbers

3. **Command & Control**
   - NCMD for Edge Node commands
   - DCMD for Device commands
   - Rebirth request capability

4. **Data Consumption**
   - Subscribe to NDATA and DDATA messages
   - Process metric updates
   - Handle historical data

## Testing

```bash
pnpm test
```

Tests include:
- Unit tests with mocked MQTT clients
- Constructor and configuration validation
- Lifecycle management tests
- Message publishing verification

Integration tests (requiring MQTT broker) are skipped by default.

## Dependencies

- `@sparkplug/namespace` - Topic namespace handling
- `@sparkplug/codec` - Sparkplug B protobuf encoding/decoding
- `mqtt` - MQTT client library

## License

MIT

## Related Packages

- [@sparkplug/codec](../codec) - Sparkplug B message encoding/decoding
- [@sparkplug/namespace](../namespace) - Topic namespace utilities
- [@sparkplug/state](../state) - State management
- [@sparkplug/broker](../broker) - MQTT broker implementation
