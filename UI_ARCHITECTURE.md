# 🎨 Sparkplug MQTT SCADA - Complete UI Architecture

## 📋 Overview

This document outlines the complete redesign of the SCADA UI with 4 main components:

1. **SCADA View** - Real-time monitoring of EoN nodes and devices
2. **Broker Viewer** - Configuration, logs, sessions, ACLs, certificates, namespaces
3. **Plant Simulator** - Graphical node designer with ReactFlow
4. **Command Panel** - Device control and command scheduling

---

## 🏗️ Technical Stack

### Core Technologies
- **React 19** - UI framework
- **TypeScript 5.7** - Type safety
- **Tailwind CSS 4** - Styling
- **Zustand** - State management
- **React Router 7** - Navigation

### Visualization Libraries
- **@xyflow/react 12.x** - Node-based graphical designer (replaces ReactFlow)
- **Recharts 2.x** - Charts and graphs
- **D3.js 7.x** - Custom visualizations
- **@tanstack/react-table 8.x** - Data tables

### Real-time Communication
- **MQTT.js 5.x** - MQTT v5 client
- **Zustand + Immer** - Real-time state updates

---

## 🎯 Component Breakdown

### 1️⃣ SCADA View (Real-time Monitoring)

**Purpose**: Monitor and visualize data from Edge of Network nodes and devices.

**Features**:
- Live dashboard with EoN nodes and devices
- Real-time metric updates (temperature, pressure, flow, etc.)
- Connection status indicators
- Birth/Death certificate viewer
- Namespace tree visualization
- Device detail panels

**Data Structure**:
```typescript
interface EoNNode {
  groupId: string;
  edgeNodeId: string;
  online: boolean;
  bdSeq: bigint;
  seq: bigint;
  birthTimestamp: bigint;
  metrics: Map<string, MetricValue>;
  devices: Device[];
}

interface Device {
  deviceId: string;
  online: boolean;
  metrics: Map<string, MetricValue>;
  tags: string[]; // "MQTT5", "SparkplugB", etc.
}
```

**Views**:
- **Grid View**: Cards for each node/device
- **Tree View**: Hierarchical namespace structure
- **Detail View**: Full metrics for selected node/device

---

### 2️⃣ Broker Configuration & State Viewer

**Purpose**: Monitor broker internals, configuration, and message flow.

**Features**:

#### Logs Tab
- Real-time message log (publish/subscribe)
- Filter by topic pattern, QoS, message type
- Color-coded by Sparkplug message type (NBIRTH, NDATA, etc.)
- Show raw payload or decoded Sparkplug
- Export logs to JSON/CSV

#### Sessions Tab
- Active MQTT sessions
- Client ID, IP address, connected time
- Clean session flag, session expiry
- Subscriptions per client
- Bytes in/out statistics

#### Topics & Subscriptions
- All active subscriptions
- Subscription tree visualization
- Wildcard analysis

#### ACLs & Security
- Access Control Lists
- Allowed/denied topics per client
- Authentication status
- TLS certificate info

#### Namespaces
- All registered Sparkplug namespaces
- Group IDs and their nodes
- Namespace statistics

#### Persistence
- Redis connection status
- Stored birth certificates
- Cached states
- Persistence statistics

#### Data Visualization Modes
1. **Linear View**: Table with columns (timestamp, topic, QoS, payload)
2. **Timeseries View**: Line charts of metric values over time
3. **Graph View**: Network graph showing message relationships
4. **Tree View**: Hierarchical topic structure (default)

**Data Structure**:
```typescript
interface BrokerLog {
  timestamp: number;
  type: 'publish' | 'subscribe' | 'unsubscribe' | 'connect' | 'disconnect';
  clientId: string;
  topic?: string;
  qos?: 0 | 1 | 2;
  retain?: boolean;
  messageType?: MessageType; // NBIRTH, NDATA, etc.
  payload?: Uint8Array;
  decoded?: Payload; // Sparkplug decoded
  origin: { ip: string; port: number };
}

interface Session {
  clientId: string;
  ip: string;
  port: number;
  connectedAt: number;
  cleanSession: boolean;
  sessionExpiry: number;
  subscriptions: string[];
  stats: {
    bytesIn: number;
    bytesOut: number;
    messagesIn: number;
    messagesOut: number;
  };
}
```

---

### 3️⃣ Plant Simulator Manager (Graphical Designer)

**Purpose**: Design and simulate complete EoN nodes with devices using a visual node-based interface.

**Features**:

#### Visual Node Designer (using @xyflow/react)
- Drag-and-drop EoN nodes
- Attach device nodes to EoN nodes
- Visual connections showing relationships
- Configuration panels for each node

#### EoN Node Configuration
- **Identity**: Group ID, Edge Node ID
- **Sparkplug Config**:
  - bdSeq strategy (sequential, random, timestamp)
  - seq behavior
  - Rebirth timeout
  - Will message config
- **Lifecycle Control**:
  - Birth/Death scheduling
  - Auto-reconnect settings
  - Offline simulation
- **Network Settings**:
  - Connection parameters
  - QoS levels
  - Clean session flag
  - MQTT v5 properties
- **Persistence**:
  - State storage
  - Metric history
- **Protocol Tag**: "Sparkplug B" or "Raw MQTT v5"

#### Device Node Configuration
- **Identity**: Device ID
- **Metrics Definition**:
  - Name, datatype, value
  - Engineering units
  - Min/max ranges
- **Data Production Cycle**:
  - Update frequency (1s, 5s, 10s, custom)
  - Value generation logic:
    - Static value
    - Random range
    - Sine wave
    - Linear trend
    - Custom formula
  - Seed for reproducibility
- **Protocol Tag**: "Sparkplug B" or "Raw MQTT v5"

#### Simulator Controls
- Start/Stop all nodes
- Start/Stop individual nodes
- Pause/Resume data generation
- Speed control (1x, 2x, 5x, 10x)
- Reset simulation

#### Node Templates
- Temperature sensor
- Pressure sensor
- Flow meter
- Motor controller
- Gateway with multiple sensors
- Custom template builder

**Data Structure**:
```typescript
interface SimulatedEoN {
  id: string;
  position: { x: number; y: number };
  config: {
    groupId: string;
    edgeNodeId: string;
    protocol: 'SparkplugB' | 'RawMQTTv5';
    sparkplugConfig: {
      bdSeqStrategy: 'sequential' | 'random' | 'timestamp';
      rebirthTimeout: number;
    };
    lifecycle: {
      birthSchedule?: string; // cron expression
      deathSchedule?: string;
      autoReconnect: boolean;
    };
    network: {
      qos: 0 | 1 | 2;
      cleanSession: boolean;
      mqttv5Properties?: Record<string, any>;
    };
  };
  devices: SimulatedDevice[];
  state: 'stopped' | 'running' | 'paused' | 'error';
}

interface SimulatedDevice {
  id: string;
  deviceId: string;
  protocol: 'SparkplugB' | 'RawMQTTv5';
  metrics: MetricDefinition[];
  dataProduction: {
    frequency: number; // ms
    logic: DataGenerationLogic;
  };
  state: 'stopped' | 'running' | 'paused';
}

interface DataGenerationLogic {
  type: 'static' | 'random' | 'sine' | 'linear' | 'formula';
  params: {
    value?: number;
    min?: number;
    max?: number;
    amplitude?: number;
    frequency?: number;
    slope?: number;
    formula?: string; // e.g., "Math.sin(t) * 100"
    seed?: number;
  };
}
```

#### ReactFlow Integration
```typescript
// Node types
const nodeTypes = {
  eon: EoNNodeComponent,      // Green, has handles for devices
  device: DeviceNodeComponent, // Blue, connects to EoN
};

// Edge types
const edgeTypes = {
  deviceConnection: DeviceEdge, // Shows data flow
};
```

---

### 4️⃣ Command Panel

**Purpose**: Send commands to simulated devices and EoN nodes with scheduling.

**Features**:

#### Device/EoN Selection
- Dropdown or tree selector
- Filter by group, node, device
- Show only running simulations
- Multi-select for batch commands

#### Command Builder
- **Command Type**:
  - NCMD (Node Command)
  - DCMD (Device Command)
  - Rebirth Request
  - Custom MQTT message
- **Metrics to Send**:
  - Metric name
  - Value
  - Datatype
  - Timestamp
- **MQTT Parameters**:
  - QoS (0, 1, 2)
  - Retain flag
  - MQTT v5 properties

#### Scheduling
- **Send Immediately**: One-time send
- **Send At**: Specific timestamp
- **Recurring**: Cron expression
  - Every 5 seconds
  - Every minute
  - Custom cron
- **Conditional**: Based on metric values

#### Command History
- All sent commands
- Status (sent, acknowledged, failed)
- Response tracking
- Resend functionality

**Data Structure**:
```typescript
interface Command {
  id: string;
  target: {
    groupId: string;
    edgeNodeId: string;
    deviceId?: string;
  };
  type: 'NCMD' | 'DCMD' | 'REBIRTH' | 'CUSTOM';
  metrics: Metric[];
  mqtt: {
    qos: 0 | 1 | 2;
    retain: boolean;
    properties?: Record<string, any>;
  };
  schedule: {
    type: 'immediate' | 'at' | 'recurring' | 'conditional';
    timestamp?: number;
    cron?: string;
    condition?: string;
  };
  status: 'pending' | 'sent' | 'acknowledged' | 'failed';
  sentAt?: number;
}
```

---

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────┐
│  Header: Logo | SCADA | Broker | Simulator |   │
│          Commands | [Connection Status]        │
├─────────────────────────────────────────────────┤
│                                                 │
│  Main Content Area (changes based on route)    │
│                                                 │
│  /scada      → SCADA View                      │
│  /broker     → Broker Viewer (tabs)            │
│  /simulator  → Plant Simulator (ReactFlow)     │
│  /commands   → Command Panel                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Navigation
```typescript
const routes = [
  { path: '/', element: <Navigate to="/scada" /> },
  { path: '/scada', element: <SCADAView /> },
  { path: '/broker', element: <BrokerViewer /> },
  { path: '/simulator', element: <PlantSimulator /> },
  { path: '/commands', element: <CommandPanel /> },
];
```

---

## 🗃️ State Management

### Zustand Stores

#### 1. MQTT Store
```typescript
interface MQTTState {
  client: MqttClient | null;
  isConnected: boolean;
  messages: BrokerLog[];
  connect: (url: string) => void;
  disconnect: () => void;
  publish: (topic: string, payload: Buffer, options: IClientPublishOptions) => void;
  subscribe: (topic: string) => void;
}
```

#### 2. SCADA Store
```typescript
interface SCADAState {
  nodes: Map<string, EoNNode>;
  devices: Map<string, Device>;
  selectedNode: string | null;
  selectedDevice: string | null;
  updateNode: (groupId: string, edgeNodeId: string, data: Partial<EoNNode>) => void;
  updateDevice: (deviceId: string, data: Partial<Device>) => void;
}
```

#### 3. Broker Store
```typescript
interface BrokerState {
  logs: BrokerLog[];
  sessions: Session[];
  subscriptions: Subscription[];
  stats: BrokerStats;
  filters: LogFilter;
  addLog: (log: BrokerLog) => void;
  updateSession: (session: Session) => void;
}
```

#### 4. Simulator Store
```typescript
interface SimulatorState {
  nodes: SimulatedEoN[];
  selectedNode: string | null;
  isRunning: boolean;
  speed: number; // 1x, 2x, 5x, 10x
  addNode: (node: SimulatedEoN) => void;
  updateNode: (id: string, updates: Partial<SimulatedEoN>) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
}
```

#### 5. Command Store
```typescript
interface CommandState {
  commands: Command[];
  history: Command[];
  createCommand: (command: Omit<Command, 'id'>) => void;
  sendCommand: (id: string) => void;
  scheduleCommand: (id: string, schedule: CommandSchedule) => void;
}
```

---

## 📦 File Structure

```
packages/ui/src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── ConnectionStatus.tsx
│   ├── scada/
│   │   ├── SCADAView.tsx
│   │   ├── NodeCard.tsx
│   │   ├── DeviceCard.tsx
│   │   ├── MetricDisplay.tsx
│   │   ├── TreeView.tsx
│   │   └── DetailPanel.tsx
│   ├── broker/
│   │   ├── BrokerViewer.tsx
│   │   ├── LogsTab.tsx
│   │   ├── SessionsTab.tsx
│   │   ├── TopicsTab.tsx
│   │   ├── ACLsTab.tsx
│   │   ├── NamespacesTab.tsx
│   │   ├── PersistenceTab.tsx
│   │   ├── LinearView.tsx
│   │   ├── TimeseriesView.tsx
│   │   ├── GraphView.tsx
│   │   └── TreeView.tsx
│   ├── simulator/
│   │   ├── PlantSimulator.tsx
│   │   ├── ReactFlowCanvas.tsx
│   │   ├── EoNNode.tsx
│   │   ├── DeviceNode.tsx
│   │   ├── ConfigPanel.tsx
│   │   ├── SimulatorControls.tsx
│   │   ├── NodeTemplates.tsx
│   │   └── MetricEditor.tsx
│   └── commands/
│       ├── CommandPanel.tsx
│       ├── TargetSelector.tsx
│       ├── CommandBuilder.tsx
│       ├── ScheduleEditor.tsx
│       └── CommandHistory.tsx
├── stores/
│   ├── mqttStore.ts
│   ├── scadaStore.ts
│   ├── brokerStore.ts
│   ├── simulatorStore.ts
│   └── commandStore.ts
├── services/
│   ├── mqttClient.ts
│   ├── sparkplugDecoder.ts
│   ├── dataGenerator.ts
│   └── commandScheduler.ts
├── types/
│   ├── scada.types.ts
│   ├── broker.types.ts
│   ├── simulator.types.ts
│   └── command.types.ts
└── App.tsx
```

---

## 🔄 Data Flow

### 1. MQTT Message Received
```
MQTT Broker → MQTTStore → Parse/Decode → Update Stores
                                        ↓
                          ┌─────────────┴─────────────┐
                          ↓                           ↓
                    SCADAStore                  BrokerStore
                    (if Sparkplug)              (always)
                          ↓                           ↓
                    UI Re-renders               Logs Tab
```

### 2. Simulator Data Generation
```
SimulatorStore → DataGenerator → Encode (Sparkplug/Raw)
                                        ↓
                                  MQTT Publish
                                        ↓
                                  Broker receives
                                        ↓
                                  Same as flow #1
```

### 3. Command Execution
```
CommandPanel → CommandStore → Build MQTT Message
                                    ↓
                              Apply Schedule
                                    ↓
                              MQTT Publish
                                    ↓
                              Track in History
```

---

## 🎯 Implementation Phases

### Phase 1: Foundation (1 hour)
- Set up routing with React Router 7
- Create basic layout (Header, Navigation)
- Set up all Zustand stores
- Install and configure ReactFlow (@xyflow/react)

### Phase 2: Broker Viewer (2 hours)
- Build BrokerViewer with tabs
- Implement LogsTab with filtering
- Create SessionsTab
- Add TopicsTab and NamespacesTab
- Build all 4 visualization modes (Linear, Timeseries, Graph, Tree)

### Phase 3: SCADA View (2 hours)
- Build SCADAView with grid and tree layouts
- Create NodeCard and DeviceCard components
- Implement real-time metric updates
- Add detail panels

### Phase 4: Plant Simulator (4 hours)
- Set up ReactFlow canvas
- Create EoNNode and DeviceNode components
- Build ConfigPanel for node/device configuration
- Implement DataGenerator service
- Add simulator controls (start/stop/pause/speed)
- Create node templates

### Phase 5: Command Panel (2 hours)
- Build CommandPanel layout
- Create TargetSelector
- Implement CommandBuilder
- Add ScheduleEditor with cron support
- Create CommandHistory viewer

### Phase 6: Integration & Polish (1 hour)
- Connect all stores
- Add real-time updates
- Test end-to-end flows
- Polish UI/UX
- Add error handling

---

## 🚀 Success Criteria

- ✅ All 4 main components functional
- ✅ Real-time MQTT message flow visualization
- ✅ Graphical node designer with ReactFlow
- ✅ Simulated EoN and devices publishing data
- ✅ Commands can be sent and scheduled
- ✅ Multiple data visualization modes
- ✅ Tags show "Sparkplug B" vs "Raw MQTT v5"
- ✅ Modern, responsive UI
- ✅ Full TypeScript type safety

---

**Estimated Total Time**: 12 hours
**Start Time**: Now
**Target Completion**: T+12 hours

Let's build this! 🚀
