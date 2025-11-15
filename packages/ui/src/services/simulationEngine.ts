/**
 * Simulation Engine
 * Main engine for running EoN node simulations and publishing MQTT messages
 */

import type { MqttClient } from 'mqtt';
import type {
  SimulatedEoN,
  MetricDefinition,
  SparkplugMetric,
  SparkplugPayload,
} from '../types/simulator.types';
import { generateMetricValue, convertToDatatype, clampValue } from './dataGenerator';
import { encodePayload } from '@sparkplug/codec';

interface SimulationState {
  intervalId?: NodeJS.Timeout;
  startTime?: number;
  nodeStates: Map<
    string,
    {
      bdSeq: bigint;
      seq: number;
      lastPublish: number;
    }
  >;
  deviceStates: Map<
    string,
    {
      nodeId: string;
      seq: number;
      lastPublish: number;
    }
  >;
  messageCount: number;
  lastMessageCount: number;
  lastStatsUpdate: number;
}

export class SimulationEngine {
  private state: SimulationState = {
    nodeStates: new Map(),
    deviceStates: new Map(),
    messageCount: 0,
    lastMessageCount: 0,
    lastStatsUpdate: Date.now(),
  };

  private currentNodes: Map<string, SimulatedEoN> | null = null;
  private currentStatsCallback: ((stats: { messagesPublished: number; messagesPerSecond: number; uptime: number }) => void) | null = null;

  constructor(
    private mqttClient: MqttClient | null,
    private speedMultiplier: number = 1
  ) {}

  /**
   * Start the simulation
   */
  start(
    nodes: Map<string, SimulatedEoN>,
    onStatsUpdate: (stats: {
      messagesPublished: number;
      messagesPerSecond: number;
      uptime: number;
    }) => void
  ): void {
    if (this.state.intervalId) {
      console.warn('⚠️  Simulation already running - stopping first');
      this.stop(nodes);
    }
    // Save references for speed changes
    this.currentNodes = nodes;
    this.currentStatsCallback = onStatsUpdate;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🚀 STARTING SIMULATION ENGINE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📡 MQTT Client Status:`);
    console.log(`   - Exists: ${this.mqttClient ? '✅ Yes' : '❌ No'}`);
    console.log(`   - Connected: ${this.mqttClient?.connected ? '✅ Yes' : '❌ No'}`);
    console.log(`   - Client ID: ${(this.mqttClient as any)?.options?.clientId || 'unknown'}`);
    console.log(``);
    console.log(`⚙️  Simulation Settings:`);
    console.log(`   - Total Nodes: ${nodes.size}`);
    console.log(`   - Speed Multiplier: ${this.speedMultiplier}x`);
    console.log(``);

    // Debug node states
    let runningCount = 0;
    let stoppedCount = 0;
    let pausedCount = 0;
    let nodesWithMetrics = 0;
    let nodesWithDevices = 0;

    for (const [, node] of nodes) {
      if (node.state === 'running') runningCount++;
      else if (node.state === 'stopped') stoppedCount++;
      else if (node.state === 'paused') pausedCount++;
      if (node.metrics && node.metrics.length > 0) nodesWithMetrics++;
      if (node.devices && node.devices.length > 0) nodesWithDevices++;
    }

    console.log(`📊 Node States:`);
    console.log(`   - Running: ${runningCount}`);
    console.log(`   - Stopped: ${stoppedCount}`);
    console.log(`   - Paused: ${pausedCount}`);
    console.log(`   - Nodes with metrics: ${nodesWithMetrics}`);
    console.log(`   - Nodes with devices: ${nodesWithDevices}`);
    console.log('');

    this.state.startTime = Date.now();
    this.state.messageCount = 0;
    this.state.lastMessageCount = 0;
    this.state.lastStatsUpdate = Date.now();

    let totalDevices = 0;
    let birthMessagesSent = 0;

    console.log('🔧 INITIALIZING NODES...');
    console.log('───────────────────────────────────────────────────────────────');

    // Initialize node states
    for (const [nodeId, node] of nodes) {
      console.log(`\n📍 Node: ${node.config.groupId}/${node.config.edgeNodeId}`);
      console.log(`   - State: ${node.state}`);
      console.log(`   - Metrics: ${node.metrics?.length || 0}`);
      console.log(`   - Devices: ${node.devices?.length || 0}`);

      if (node.state === 'running') {
        console.log(`   ✅ RUNNING - Initializing...`);

        this.initializeNodeState(nodeId, node);
        this.publishNodeBirth(node);
        birthMessagesSent++;

        // Publish DBIRTH for all devices
        if (node.devices && node.devices.length > 0) {
          for (const device of node.devices) {
            console.log(`   └─ Device: ${device.deviceId} (${device.metrics?.length || 0} metrics)`);
            totalDevices++;
            this.initializeDeviceState(device.id, node.id);
            this.publishDeviceBirth(node, device);
            birthMessagesSent++;
          }
        }
      } else {
        console.log(`   ⏭️  SKIPPED (state is '${node.state}', not 'running')`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`✨ SIMULATION ENGINE STARTED`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Total Nodes Initialized: ${birthMessagesSent - totalDevices}`);
    console.log(`   Total Devices Initialized: ${totalDevices}`);
    console.log(`   Birth Messages Sent: ${birthMessagesSent}`);
    console.log(`   Publishing interval: ${1000 / this.speedMultiplier}ms`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Start the main loop
    this.startMainLoop();
  }

  /**
   * Main simulation loop (extracted for speed changes)
   */
  private startMainLoop(): void {
    if (!this.currentNodes || !this.currentStatsCallback) return;

    const nodes = this.currentNodes;
    const onStatsUpdate = this.currentStatsCallback;

    this.state.intervalId = setInterval(() => {
      const currentTime = (Date.now() - (this.state.startTime || 0)) / 1000;

      for (const [nodeId, node] of nodes) {
        if (node.state === 'running') {
          this.updateNode(nodeId, node, currentTime);
          // Update devices
          if (node.devices && node.devices.length > 0) {
            for (const device of node.devices) {
              this.updateDevice(device.id, node, device, currentTime);
            }
          }
        }
      }

      // Update statistics every second
      const now = Date.now();
      if (now - this.state.lastStatsUpdate >= 1000) {
        const elapsed = (now - this.state.lastStatsUpdate) / 1000;
        const messagesPerSecond =
          (this.state.messageCount - this.state.lastMessageCount) / elapsed;

        // Log stats periodically (every 5 seconds)
        if (Math.floor(currentTime) % 5 === 0) {
          console.log(`📊 Stats: ${this.state.messageCount} total msgs | ${messagesPerSecond.toFixed(1)} msg/s | uptime: ${Math.floor(currentTime)}s`);
        }

        onStatsUpdate({
          messagesPublished: this.state.messageCount,
          messagesPerSecond,
          uptime: currentTime,
        });

        this.state.lastMessageCount = this.state.messageCount;
        this.state.lastStatsUpdate = now;
      }
    }, 1000 / this.speedMultiplier);
  }

  /**
   * Pause the simulation (without sending death certificates)
   */
  pause(): void {
    console.log('\n⏸️  Pausing simulation engine...');

    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = undefined;
    }

    const uptime = this.state.startTime ? (Date.now() - this.state.startTime) / 1000 : 0;

    console.log(`\n✅ Simulation paused`);
    console.log(`   Total Messages Published: ${this.state.messageCount}`);
    console.log(`   Total Uptime: ${Math.floor(uptime)}s\n`);

    // Synchronize final stats to UI
    if (this.currentStatsCallback) {
      this.currentStatsCallback({
        messagesPublished: this.state.messageCount,
        messagesPerSecond: 0,
        uptime,
      });
    }

    // Note: Do NOT clear nodeStates, deviceStates, or currentNodes
    // We keep them to resume later
  }

  /**
   * Resume the simulation (without sending birth certificates again)
   */
  resume(): void {
    console.log('\n▶️  Resuming simulation engine...');

    if (!this.currentNodes || !this.currentStatsCallback) {
      console.warn('⚠️  Cannot resume - no previous simulation state');
      return;
    }

    if (this.state.intervalId) {
      console.warn('⚠️  Simulation already running');
      return;
    }

    // Update start time to account for pause duration
    const pauseDuration = this.state.startTime ? (Date.now() - this.state.startTime) / 1000 : 0;
    this.state.startTime = Date.now() - (pauseDuration * 1000);

    // Restart the main loop
    this.startMainLoop();

    console.log(`\n✅ Simulation resumed\n`);
  }

  /**
   * Stop the simulation (with death certificates)
   */
  stop(nodes: Map<string, SimulatedEoN>): void {
    console.log('\n🛑 Stopping simulation engine...');

    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = undefined;
    }

    let deathMsgCount = 0;

    // Publish death certificates for all running or paused nodes and devices
    for (const [, node] of nodes) {
      if (node.state === 'running' || node.state === 'paused') {
        console.log(`\n💀 Publishing death certificates for: ${node.config.groupId}/${node.config.edgeNodeId}`);

        // Publish DDEATH for all devices first
        if (node.devices && node.devices.length > 0) {
          console.log(`   └─ Publishing DDEATH for ${node.devices.length} device(s)...`);
          for (const device of node.devices) {
            this.publishDeviceDeath(node, device);
            deathMsgCount++;
          }
        }
        // Then publish NDEATH for node
        this.publishNodeDeath(node);
        deathMsgCount++;
      }
    }

    const uptime = this.state.startTime ? (Date.now() - this.state.startTime) / 1000 : 0;

    console.log(`\n✅ Simulation stopped`);
    console.log(`   Total Messages Published: ${this.state.messageCount}`);
    console.log(`   Death Certificates: ${deathMsgCount}`);
    console.log(`   Total Uptime: ${Math.floor(uptime)}s\n`);

    // Synchronize final stats to UI before clearing
    if (this.currentStatsCallback) {
      this.currentStatsCallback({
        messagesPublished: this.state.messageCount,
        messagesPerSecond: 0,
        uptime,
      });
    }

    this.state.nodeStates.clear();
    this.state.deviceStates.clear();
    this.currentNodes = null;
    this.currentStatsCallback = null;
  }

  /**
   * Reset the simulation engine state
   */
  reset(): void {
    console.log('\n🔄 Resetting simulation engine...');

    // Clear interval if running
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = undefined;
    }

    // Reset all state
    this.state.nodeStates.clear();
    this.state.deviceStates.clear();
    this.state.messageCount = 0;
    this.state.lastMessageCount = 0;
    this.state.lastStatsUpdate = Date.now();
    this.state.startTime = undefined;

    this.currentNodes = null;
    this.currentStatsCallback = null;

    console.log('✅ Simulation engine reset complete\n');
  }

  /**
   * Check if simulation is currently running
   */
  isRunning(): boolean {
    return this.state.intervalId !== undefined;
  }

  /**
   * Update speed multiplier (restarts interval if running)
   */
  setSpeed(speed: number): void {
    const wasRunning = this.state.intervalId !== undefined;

    this.speedMultiplier = speed;

    // If simulation is running, restart the interval with new speed
    if (wasRunning) {
      console.log(`⚡ Updating simulation speed to ${speed}x...`);

      // Clear current interval
      if (this.state.intervalId) {
        clearInterval(this.state.intervalId);
        this.state.intervalId = undefined;
      }

      // Restart with new speed
      this.startMainLoop();
    }
  }

  /**
   * Initialize state for a node
   */
  private initializeNodeState(_nodeId: string, node: SimulatedEoN): void {
    const bdSeq = this.generateBdSeq(node);
    this.state.nodeStates.set(node.id, {
      bdSeq,
      seq: 0,
      lastPublish: Date.now(),
    });
  }

  /**
   * Generate bdSeq based on strategy
   */
  private generateBdSeq(node: SimulatedEoN): bigint {
    switch (node.config.sparkplugConfig.bdSeqStrategy) {
      case 'sequential':
        return BigInt(0);
      case 'random':
        return BigInt(Math.floor(Math.random() * 256));
      case 'timestamp':
        return BigInt(Date.now());
      default:
        return BigInt(0);
    }
  }

  /**
   * Increment sequence number (0-255 wrapping)
   */
  private incrementSeq(nodeId: string): number {
    const nodeState = this.state.nodeStates.get(nodeId);
    if (!nodeState) return 0;

    nodeState.seq = (nodeState.seq + 1) % 256;
    return nodeState.seq;
  }

  /**
   * Publish NBIRTH message
   */
  private publishNodeBirth(node: SimulatedEoN): void {
    if (!this.mqttClient || !this.mqttClient.connected) {
      console.warn('⚠️  MQTT client not connected');
      return;
    }

    const nodeState = this.state.nodeStates.get(node.id);
    if (!nodeState) return;

    const topic = `spBv1.0/${node.config.groupId}/NBIRTH/${node.config.edgeNodeId}`;

    // Build strongly-typed Sparkplug payload
    const payload: SparkplugPayload = {
      timestamp: BigInt(Date.now()),
      metrics: this.buildMetrics(node.metrics || [], 0),
      seq: BigInt(this.incrementSeq(node.id)),
    };

    // Add bdSeq metric to the beginning
    const bdSeqMetric: SparkplugMetric = {
      name: 'bdSeq',
      timestamp: BigInt(Date.now()),
      datatype: 8, // UInt64
      value: nodeState.bdSeq,
    };
    payload.metrics.unshift(bdSeqMetric);

    this.publish(topic, payload, node.config.network.qos);
  }

  /**
   * Publish NDATA message
   */
  private publishNodeData(node: SimulatedEoN, currentTime: number): void {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const topic = `spBv1.0/${node.config.groupId}/NDATA/${node.config.edgeNodeId}`;

    const payload: SparkplugPayload = {
      timestamp: BigInt(Date.now()),
      metrics: this.buildMetrics(node.metrics || [], currentTime),
      seq: BigInt(this.incrementSeq(node.id)),
    };

    this.publish(topic, payload, node.config.network.qos);
  }

  /**
   * Publish NDEATH message
   */
  private publishNodeDeath(node: SimulatedEoN): void {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const nodeState = this.state.nodeStates.get(node.id);
    if (!nodeState) return;

    const topic = `spBv1.0/${node.config.groupId}/NDEATH/${node.config.edgeNodeId}`;

    const bdSeqMetric: SparkplugMetric = {
      name: 'bdSeq',
      timestamp: BigInt(Date.now()),
      datatype: 8, // UInt64
      value: nodeState.bdSeq,
    };

    const payload: SparkplugPayload = {
      timestamp: BigInt(Date.now()),
      metrics: [bdSeqMetric],
      seq: BigInt(this.incrementSeq(node.id)),
    };

    this.publish(topic, payload, node.config.network.qos);
  }

  /**
   * Update a node (publish NDATA if needed)
   */
  private updateNode(_nodeId: string, node: SimulatedEoN, currentTime: number): void {
    const nodeState = this.state.nodeStates.get(node.id);
    if (!nodeState) return;

    // Publish NDATA every second (adjustable based on config)
    const now = Date.now();
    const publishInterval = 1000; // 1 second

    if (now - nodeState.lastPublish >= publishInterval / this.speedMultiplier) {
      this.publishNodeData(node, currentTime);
      nodeState.lastPublish = now;
    }
  }

  /**
   * Initialize state for a device
   */
  private initializeDeviceState(deviceId: string, nodeId: string): void {
    this.state.deviceStates.set(deviceId, {
      nodeId,
      seq: 0,
      lastPublish: Date.now(),
    });
  }

  /**
   * Publish DBIRTH message
   */
  private publishDeviceBirth(node: SimulatedEoN, device: any): void {
    if (!this.mqttClient || !this.mqttClient.connected) {
      console.warn('⚠️  MQTT client not connected');
      return;
    }

    const deviceState = this.state.deviceStates.get(device.id);
    if (!deviceState) return;

    const topic = `spBv1.0/${node.config.groupId}/DBIRTH/${node.config.edgeNodeId}/${device.deviceId}`;

    // Build strongly-typed Sparkplug payload
    const payload: SparkplugPayload = {
      timestamp: BigInt(Date.now()),
      metrics: this.buildMetrics(device.metrics || [], 0),
      seq: BigInt(this.incrementDeviceSeq(device.id)),
    };

    this.publish(topic, payload, node.config.network.qos);
  }

  /**
   * Publish DDATA message
   */
  private publishDeviceData(node: SimulatedEoN, device: any, currentTime: number): void {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const topic = `spBv1.0/${node.config.groupId}/DDATA/${node.config.edgeNodeId}/${device.deviceId}`;

    const payload: SparkplugPayload = {
      timestamp: BigInt(Date.now()),
      metrics: this.buildMetrics(device.metrics || [], currentTime),
      seq: BigInt(this.incrementDeviceSeq(device.id)),
    };

    this.publish(topic, payload, node.config.network.qos);
  }

  /**
   * Publish DDEATH message
   */
  private publishDeviceDeath(node: SimulatedEoN, device: any): void {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const deviceState = this.state.deviceStates.get(device.id);
    if (!deviceState) return;

    const topic = `spBv1.0/${node.config.groupId}/DDEATH/${node.config.edgeNodeId}/${device.deviceId}`;

    const payload: SparkplugPayload = {
      timestamp: BigInt(Date.now()),
      metrics: [],
      seq: BigInt(this.incrementDeviceSeq(device.id)),
    };

    this.publish(topic, payload, node.config.network.qos);
  }

  /**
   * Update a device (publish DDATA if needed)
   */
  private updateDevice(deviceId: string, node: SimulatedEoN, device: any, currentTime: number): void {
    const deviceState = this.state.deviceStates.get(deviceId);
    if (!deviceState) return;

    // Check if device data production is explicitly disabled
    if (device.dataProduction?.enabled === false) return;

    const now = Date.now();
    const publishInterval = device.dataProduction?.frequency || 1000;

    if (now - deviceState.lastPublish >= publishInterval / this.speedMultiplier) {
      this.publishDeviceData(node, device, currentTime);
      deviceState.lastPublish = now;
    }
  }

  /**
   * Increment device sequence number (0-255 wrapping)
   */
  private incrementDeviceSeq(deviceId: string): number {
    const deviceState = this.state.deviceStates.get(deviceId);
    if (!deviceState) return 0;

    deviceState.seq = (deviceState.seq + 1) % 256;
    return deviceState.seq;
  }

  /**
   * Get default value for a Sparkplug datatype
   * Used when metric value is null/undefined
   */
  private getDefaultValueForDatatype(datatype: number): any {
    switch (datatype) {
      case 1: // Int8
      case 2: // Int16
      case 3: // Int32
      case 5: // UInt8
      case 6: // UInt16
      case 7: // UInt32
        return 0;
      case 4: // Int64
      case 8: // UInt64
      case 9: // DateTime
        return BigInt(0);
      case 10: // Float
      case 11: // Double
        return 0.0;
      case 12: // Boolean
        return false;
      case 13: // String
      case 14: // Text
        return '';
      case 15: // UUID
        return '00000000-0000-0000-0000-000000000000';
      case 16: // Bytes
        return new Uint8Array(0);
      default:
        console.warn(`⚠️  Unknown datatype ${datatype}, defaulting to 0`);
        return 0;
    }
  }

  /**
   * Build metrics array from definitions
   * Returns strongly-typed SparkplugMetric array
   */
  private buildMetrics(
    metricDefs: MetricDefinition[],
    currentTime: number
  ): SparkplugMetric[] {
    return metricDefs.map((metricDef) => {
      let value: any;

      if (metricDef.logic) {
        const rawValue = generateMetricValue(
          currentTime,
          metricDef.logic,
          this.speedMultiplier
        );

        // Clamp to range if specified
        const clampedValue = clampValue(
          rawValue,
          metricDef.properties?.min,
          metricDef.properties?.max
        );

        // Convert to proper datatype
        value = convertToDatatype(clampedValue, metricDef.datatype);
      } else {
        value = metricDef.value;
      }

      // CRITICAL: Ensure value is never null/undefined (encoder will fail)
      if (value === null || value === undefined) {
        console.warn(`⚠️  Metric "${metricDef.name}" has null/undefined value, using default for datatype ${metricDef.datatype}`);
        value = this.getDefaultValueForDatatype(metricDef.datatype);
      }

      // Build strongly-typed SparkplugMetric
      const metric: SparkplugMetric = {
        name: metricDef.name,
        timestamp: BigInt(Date.now()),
        datatype: metricDef.datatype,
        value,
      };

      // Add optional alias (must be BigInt)
      if (metricDef.alias !== undefined) {
        metric.alias = typeof metricDef.alias === 'bigint'
          ? metricDef.alias
          : BigInt(metricDef.alias);
      }

      // Add optional properties
      if (metricDef.properties) {
        metric.properties = {};
        if (metricDef.properties.engineeringUnits) {
          metric.properties.engineeringUnits = metricDef.properties.engineeringUnits;
        }
        if (metricDef.properties.description) {
          metric.properties.description = metricDef.properties.description;
        }
      }

      return metric;
    });
  }

  /**
   * Publish message to MQTT broker
   * @param topic - MQTT topic
   * @param payload - Strongly-typed Sparkplug payload
   * @param qos - Quality of Service level
   */
  private publish(topic: string, payload: SparkplugPayload, qos: 0 | 1 | 2): void {
    console.log(`\n📤 Attempting to publish...`);
    console.log(`   Topic: ${topic}`);
    console.log(`   QoS: ${qos}`);

    if (!this.mqttClient) {
      console.error(`❌ MQTT client is NULL!`);
      return;
    }

    if (!this.mqttClient.connected) {
      console.error(`❌ MQTT client NOT connected!`);
      console.error(`   Client state:`, {
        connected: this.mqttClient.connected,
        reconnecting: (this.mqttClient as any).reconnecting,
        options: (this.mqttClient as any).options?.clientId,
      });
      return;
    }

    console.log(`   ✅ MQTT client is connected`);

    try {
      // Encode payload using Sparkplug B protobuf format
      console.log(`   🔧 Encoding payload...`);

      // Log payload structure for debugging (convert BigInt to string for display)
      const payloadForLog = JSON.stringify(payload, (key, value) =>
        typeof value === 'bigint' ? value.toString() + 'n' : value
      );
      console.log(`   📦 Payload structure:`, payloadForLog);

      const encodedPayload = encodePayload(payload);
      const payloadBuffer = Buffer.from(encodedPayload);
      console.log(`   ✅ Payload encoded (${payloadBuffer.length} bytes)`);

      // Extract message type from topic
      const topicParts = topic.split('/');
      const msgType = topicParts[2]; // NBIRTH, NDATA, DBIRTH, DDATA, etc.
      const metricsCount = payload.metrics?.length || 0;

      console.log(`   📨 Publishing ${msgType} with ${metricsCount} metrics...`);

      this.mqttClient.publish(topic, payloadBuffer, { qos }, (error) => {
        if (error) {
          console.error(`❌ Failed to publish ${msgType}:`, error);
          console.error(`   Topic: ${topic}`);
        } else {
          this.state.messageCount++;
          console.log(`✅ PUBLISHED ${msgType} → ${topic} (seq: ${payload.seq}, count: ${this.state.messageCount})`);
        }
      });
    } catch (error) {
      console.error(`❌ Error encoding/publishing message to ${topic}:`, error);
      console.error(`   Error details:`, error);
    }
  }
}

/**
 * Create a simulation engine instance
 */
export function createSimulationEngine(
  mqttClient: MqttClient | null,
  speedMultiplier: number = 1
): SimulationEngine {
  return new SimulationEngine(mqttClient, speedMultiplier);
}
