/**
 * Simulation Engine
 * Main engine for running EoN node simulations and publishing MQTT messages
 */

import type { MqttClient } from 'mqtt';
import type { SimulatedEoN, MetricDefinition } from '../types/simulator.types';
import { generateMetricValue, convertToDatatype, clampValue } from './dataGenerator';

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
      console.warn('Simulation already running');
      return;
    }

    this.state.startTime = Date.now();
    this.state.messageCount = 0;
    this.state.lastMessageCount = 0;
    this.state.lastStatsUpdate = Date.now();

    // Initialize node states
    for (const [nodeId, node] of nodes) {
      if (node.state === 'running') {
        this.initializeNodeState(nodeId, node);
        this.publishNodeBirth(node);
        // Publish DBIRTH for all devices
        if (node.devices && node.devices.length > 0) {
          for (const device of node.devices) {
            this.initializeDeviceState(device.id, node.id);
            this.publishDeviceBirth(node, device);
          }
        }
      }
    }

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
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = undefined;
    }

    // Publish death certificates for all running nodes and devices
    for (const [, node] of nodes) {
      if (node.state === 'running') {
        // Publish DDEATH for all devices first
        if (node.devices && node.devices.length > 0) {
          for (const device of node.devices) {
            this.publishDeviceDeath(node, device);
          }
        }
        // Then publish NDEATH for node
        this.publishNodeDeath(node);
      }
    }

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
      console.warn('MQTT client not connected');
      return;
    }

    const nodeState = this.state.nodeStates.get(node.id);
    if (!nodeState) return;

    const topic = `spBv1.0/${node.config.groupId}/NBIRTH/${node.config.edgeNodeId}`;

    // Build Sparkplug payload
    const payload = {
      timestamp: Date.now(),
      metrics: this.buildMetrics(node.metrics || [], 0),
      seq: this.incrementSeq(node.id),
    };

    // Add bdSeq to metrics
    payload.metrics.unshift({
      name: 'bdSeq',
      timestamp: Date.now(),
      datatype: 8, // UInt64
      value: nodeState.bdSeq,
    });

    this.publish(topic, payload, node.config.network.qos);

    console.log(`📤 NBIRTH: ${topic}`);
  }

  /**
   * Publish NDATA message
   */
  private publishNodeData(node: SimulatedEoN, currentTime: number): void {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const topic = `spBv1.0/${node.config.groupId}/NDATA/${node.config.edgeNodeId}`;

    const payload = {
      timestamp: Date.now(),
      metrics: this.buildMetrics(node.metrics || [], currentTime),
      seq: this.incrementSeq(node.id),
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
      timestamp: Date.now(),
      metrics: [
        {
          name: 'bdSeq',
          timestamp: Date.now(),
          datatype: 8,
          value: nodeState.bdSeq,
        },
      ],
    };

    this.publish(topic, payload, node.config.network.qos);

    console.log(`📤 NDEATH: ${topic}`);
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
      console.warn('MQTT client not connected');
      return;
    }

    const deviceState = this.state.deviceStates.get(device.id);
    if (!deviceState) return;

    const topic = `spBv1.0/${node.config.groupId}/DBIRTH/${node.config.edgeNodeId}/${device.deviceId}`;

    // Build Sparkplug payload
    const payload = {
      timestamp: Date.now(),
      metrics: this.buildMetrics(device.metrics || [], 0),
      seq: this.incrementDeviceSeq(device.id),
    };

    this.publish(topic, payload, node.config.network.qos);

    console.log(`📤 DBIRTH: ${topic}`);
  }

  /**
   * Publish DDATA message
   */
  private publishDeviceData(node: SimulatedEoN, device: any, currentTime: number): void {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const topic = `spBv1.0/${node.config.groupId}/DDATA/${node.config.edgeNodeId}/${device.deviceId}`;

    const payload = {
      timestamp: Date.now(),
      metrics: this.buildMetrics(device.metrics || [], currentTime),
      seq: this.incrementDeviceSeq(device.id),
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
      timestamp: Date.now(),
      metrics: [],
    };

    this.publish(topic, payload, node.config.network.qos);

    console.log(`📤 DDEATH: ${topic}`);
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
    timestamp: number;
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
        timestamp: Date.now(),
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
    if (!this.mqttClient || !this.mqttClient.connected) return;

    try {
      // Convert to JSON for now (in production, use @sparkplug/codec to encode)
      const payloadBuffer = Buffer.from(JSON.stringify(payload));

      this.mqttClient.publish(topic, payloadBuffer, { qos }, (error) => {
        if (error) {
          console.error('Publish error:', error);
        } else {
          this.state.messageCount++;
        }
      });
    } catch (error) {
      console.error('Error publishing message:', error);
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
