/**
 * Simulation Engine
 * Main engine for running EoN node simulations and publishing MQTT messages
 */

import type { MqttClient } from 'mqtt';
import type { SimulatedEoN, MetricDefinition } from '../types/simulator.types';
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

    console.log('\n🚀 Starting simulation engine...');
    console.log(`   MQTT Client: ${this.mqttClient ? '✅ Created' : '❌ null'}`);
    console.log(`   MQTT Connected: ${this.mqttClient?.connected ? '✅ Yes' : '❌ No'}`);
    console.log(`   Total Nodes: ${nodes.size}`);
    console.log(`   Speed Multiplier: ${this.speedMultiplier}x`);

    // Debug node states
    let runningCount = 0;
    let stoppedCount = 0;
    let pausedCount = 0;
    for (const [, node] of nodes) {
      if (node.state === 'running') runningCount++;
      else if (node.state === 'stopped') stoppedCount++;
      else if (node.state === 'paused') pausedCount++;
    }
    console.log(`   Node States: ${runningCount} running, ${stoppedCount} stopped, ${pausedCount} paused`);

    this.state.startTime = Date.now();
    this.state.messageCount = 0;
    this.state.lastMessageCount = 0;
    this.state.lastStatsUpdate = Date.now();

    let totalDevices = 0;

    // Initialize node states
    for (const [nodeId, node] of nodes) {
      if (node.state === 'running') {
        console.log(`\n📍 Initializing node: ${node.config.groupId}/${node.config.edgeNodeId}`);
        this.initializeNodeState(nodeId, node);
        this.publishNodeBirth(node);

        // Publish DBIRTH for all devices
        if (node.devices && node.devices.length > 0) {
          console.log(`   └─ Devices: ${node.devices.length}`);
          for (const device of node.devices) {
            totalDevices++;
            this.initializeDeviceState(device.id, node.id);
            this.publishDeviceBirth(node, device);
          }
        }
      }
    }

    console.log(`\n✨ Simulation started!`);
    console.log(`   Total Devices: ${totalDevices}`);
    console.log(`   Messages will be published based on configured frequencies\n`);

    // Main simulation loop
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
   * Stop the simulation
   */
  stop(nodes: Map<string, SimulatedEoN>): void {
    console.log('\n🛑 Stopping simulation engine...');

    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = undefined;
    }

    let deathMsgCount = 0;

    // Publish death certificates for all running nodes and devices
    for (const [, node] of nodes) {
      if (node.state === 'running') {
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

    this.state.nodeStates.clear();
    this.state.deviceStates.clear();
  }

  /**
   * Update speed multiplier
   */
  setSpeed(speed: number): void {
    this.speedMultiplier = speed;
  }

  /**
   * Reset simulation state completely
   */
  reset(): void {
    console.log('🔄 Resetting simulation engine...');

    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = undefined;
    }

    this.state.startTime = undefined;
    this.state.messageCount = 0;
    this.state.lastMessageCount = 0;
    this.state.lastStatsUpdate = Date.now();
    this.state.nodeStates.clear();
    this.state.deviceStates.clear();

    console.log('✅ Simulation engine reset complete\n');
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

    // Build Sparkplug payload
    const payload = {
      timestamp: BigInt(Date.now()),
      metrics: this.buildMetrics(node.metrics || [], 0),
      seq: BigInt(this.incrementSeq(node.id)),
    };

    // Add bdSeq to metrics
    payload.metrics.unshift({
      name: 'bdSeq',
      timestamp: BigInt(Date.now()),
      datatype: 8, // UInt64
      value: nodeState.bdSeq,
    });

    this.publish(topic, payload, node.config.network.qos);
  }

  /**
   * Publish NDATA message
   */
  private publishNodeData(node: SimulatedEoN, currentTime: number): void {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const topic = `spBv1.0/${node.config.groupId}/NDATA/${node.config.edgeNodeId}`;

    const payload = {
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

    const payload = {
      timestamp: BigInt(Date.now()),
      metrics: [
        {
          name: 'bdSeq',
          timestamp: BigInt(Date.now()),
          datatype: 8,
          value: nodeState.bdSeq,
        },
      ],
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

    // Build Sparkplug payload
    const payload = {
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

    const payload = {
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

    const payload = {
      timestamp: BigInt(Date.now()),
      metrics: [],
    };

    this.publish(topic, payload, node.config.network.qos);
  }

  /**
   * Update a device (publish DDATA if needed)
   */
  private updateDevice(deviceId: string, node: SimulatedEoN, device: any, currentTime: number): void {
    const deviceState = this.state.deviceStates.get(deviceId);
    if (!deviceState) return;

    // Check if device data production is enabled
    if (!device.dataProduction?.enabled) return;

    const now = Date.now();
    const publishInterval = device.dataProduction.frequency || 1000;

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
   * Build metrics array from definitions
   */
  private buildMetrics(
    metricDefs: MetricDefinition[],
    currentTime: number
  ): Array<{
    name: string;
    timestamp: bigint;
    datatype: number;
    value: any;
    alias?: bigint;
    properties?: {
      engineeringUnits?: string;
      description?: string;
    };
  }> {
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

      const metric: any = {
        name: metricDef.name,
        timestamp: BigInt(Date.now()),
        datatype: metricDef.datatype,
        value,
      };

      if (metricDef.alias !== undefined) {
        metric.alias = metricDef.alias;
      }

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
   */
  private publish(topic: string, payload: any, qos: 0 | 1 | 2): void {
    if (!this.mqttClient || !this.mqttClient.connected) {
      console.warn('⚠️  MQTT client not connected, cannot publish to:', topic);
      return;
    }

    try {
      // Encode payload using Sparkplug B protobuf format
      const encodedPayload = encodePayload(payload);
      const payloadBuffer = Buffer.from(encodedPayload);

      // Extract message type from topic
      const topicParts = topic.split('/');
      const msgType = topicParts[2]; // NBIRTH, NDATA, DBIRTH, DDATA, etc.
      const metricsCount = payload.metrics?.length || 0;

      this.mqttClient.publish(topic, payloadBuffer, { qos }, (error) => {
        if (error) {
          console.error(`❌ Failed to publish ${msgType}:`, error);
          console.error(`   Topic: ${topic}`);
        } else {
          this.state.messageCount++;
          console.log(`✅ Published ${msgType} → ${topic} (${metricsCount} metrics, seq: ${payload.seq})`);
        }
      });
    } catch (error) {
      console.error(`❌ Error encoding/publishing message to ${topic}:`, error);
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
