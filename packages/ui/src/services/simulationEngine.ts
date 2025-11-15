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
  PropertySet,
  PropertyValue,
} from '../types/simulator.types';
import { generateMetricValue, convertToDatatype, clampValue } from './dataGenerator';
import { encodePayload, decodePayload } from '@sparkplug/codec';

interface MetricHistoryEntry {
  timestamp: bigint;
  value: any;
  datatype: number;
}

interface SimulationState {
  intervalId?: NodeJS.Timeout;
  startTime?: number;
  nodeStates: Map<
    string,
    {
      bdSeq: bigint;
      seq: number;
      lastPublish: number;
      birthSent: boolean; // Track if BIRTH has been sent (for alias optimization)
    }
  >;
  deviceStates: Map<
    string,
    {
      nodeId: string;
      seq: number;
      lastPublish: number;
      birthSent: boolean; // Track if BIRTH has been sent (for alias optimization)
    }
  >;
  messageCount: number;
  lastMessageCount: number;
  lastStatsUpdate: number;
  // Metric history tracking (Priority 3)
  // Key format: "nodeId:metricName" or "deviceId:metricName"
  metricHistory: Map<string, MetricHistoryEntry[]>;
  maxHistoryEntries: number;
}

export class SimulationEngine {
  private state: SimulationState = {
    nodeStates: new Map(),
    deviceStates: new Map(),
    messageCount: 0,
    lastMessageCount: 0,
    lastStatsUpdate: Date.now(),
    metricHistory: new Map(),
    maxHistoryEntries: 100, // Keep last 100 values per metric
  };

  private currentNodes: Map<string, SimulatedEoN> | null = null;
  private currentStatsCallback: ((stats: { messagesPublished: number; messagesPerSecond: number; uptime: number }) => void) | null = null;

  constructor(
    private mqttClient: MqttClient | null,
    private speedMultiplier: number = 1
  ) {}

  /**
   * Generate Will Message configuration for MQTT client
   * CRITICAL: Sparkplug B spec REQUIRES Will Message for proper disconnect handling
   *
   * @param node - The primary node to create Will Message for
   * @returns Will Message configuration object for MQTT client options
   */
  public static generateWillMessage(node: SimulatedEoN): {
    topic: string;
    payload: Buffer;
    qos: 1;
    retain: false;
  } {
    const topic = `spBv1.0/${node.config.groupId}/NDEATH/${node.config.edgeNodeId}`;

    // Create NDEATH payload for Will Message
    // Use bdSeq = 0 as placeholder (will be updated when actual connection is made)
    const willPayload: SparkplugPayload = {
      timestamp: BigInt(Date.now()),
      metrics: [
        {
          name: 'bdSeq',
          timestamp: BigInt(Date.now()),
          datatype: 8, // UInt64
          value: BigInt(0), // Placeholder
        },
      ],
      seq: BigInt(0),
    };

    // Encode the payload
    const encodedPayload = encodePayload(willPayload as any);

    return {
      topic,
      payload: Buffer.from(encodedPayload),
      qos: 1, // REQUIRED by Sparkplug B spec
      retain: false, // MUST be false per spec
    };
  }

  /**
   * Validate configuration against Sparkplug B specification
   * Priority 3: Add validation warnings for spec violations
   *
   * @param nodes - Map of simulated nodes to validate
   */
  private validateConfiguration(nodes: Map<string, SimulatedEoN>): void {
    console.log('\n🔍 Validating Sparkplug B configuration...\n');

    let warningCount = 0;

    for (const [, node] of nodes) {
      const nodeId = node.config.edgeNodeId;

      // Validate QoS settings
      const qos = node.config.network.qos;
      if (qos !== 0 && qos !== 1 && qos !== 2) {
        console.warn(`⚠️  [${nodeId}] Invalid QoS value: ${qos}. Must be 0, 1, or 2.`);
        warningCount++;
      }

      if (qos === 2) {
        console.warn(`⚠️  [${nodeId}] QoS 2 is not recommended by Sparkplug B spec. Use QoS 0 or 1.`);
        warningCount++;
      }

      if (qos !== 1) {
        console.warn(
          `⚠️  [${nodeId}] QoS is ${qos}. Sparkplug B spec REQUIRES QoS 1 for BIRTH/DEATH messages.\n` +
          `   Note: This simulator enforces QoS 1 for BIRTH/DEATH regardless of this setting.`
        );
        warningCount++;
      }

      // Validate cleanSession setting
      if (node.config.network.cleanSession === false) {
        console.warn(
          `⚠️  [${nodeId}] cleanSession is false. Sparkplug B spec RECOMMENDS cleanSession=true.\n` +
          `   Persistent sessions can cause issues with bdSeq tracking.`
        );
        warningCount++;
      }

      // Validate metrics have aliases for optimization
      const metricsWithoutAlias: string[] = [];
      if (node.metrics) {
        for (const metric of node.metrics) {
          if (metric.alias === undefined && metric.name) {
            metricsWithoutAlias.push(metric.name);
          }
        }
      }

      if (metricsWithoutAlias.length > 0) {
        console.warn(
          `⚠️  [${nodeId}] ${metricsWithoutAlias.length} node metrics missing alias (optimization opportunity):\n` +
          `   ${metricsWithoutAlias.slice(0, 5).join(', ')}${metricsWithoutAlias.length > 5 ? '...' : ''}\n` +
          `   Tip: Define aliases to reduce NDATA/DDATA payload size.`
        );
        warningCount++;
      }

      // Validate device metrics
      if (node.devices) {
        for (const device of node.devices) {
          const deviceMetricsWithoutAlias: string[] = [];
          if (device.metrics) {
            for (const metric of device.metrics) {
              if (metric.alias === undefined && metric.name) {
                deviceMetricsWithoutAlias.push(metric.name);
              }
            }
          }

          if (deviceMetricsWithoutAlias.length > 0) {
            console.warn(
              `⚠️  [${nodeId}/${device.deviceId}] ${deviceMetricsWithoutAlias.length} device metrics missing alias:\n` +
              `   ${deviceMetricsWithoutAlias.slice(0, 5).join(', ')}${deviceMetricsWithoutAlias.length > 5 ? '...' : ''}`
            );
            warningCount++;
          }
        }
      }

      // Validate metric datatypes match values
      if (node.metrics) {
        for (const metric of node.metrics) {
          if (metric.value !== undefined && metric.value !== null) {
            const valueType = typeof metric.value;
            const expectedType = this.getExpectedTypeForDatatype(metric.datatype);

            if (expectedType && valueType !== expectedType && valueType !== 'object') {
              console.warn(
                `⚠️  [${nodeId}] Metric "${metric.name}" has datatype ${metric.datatype} (expects ${expectedType}) but value is ${valueType}: ${metric.value}`
              );
              warningCount++;
            }
          }
        }
      }
    }

    if (warningCount === 0) {
      console.log('✅ Configuration validation passed with no warnings.\n');
    } else {
      console.log(`⚠️  Configuration validation completed with ${warningCount} warning(s).\n`);
    }
  }

  /**
   * Get expected JavaScript type for a Sparkplug datatype
   * Used for validation warnings
   */
  private getExpectedTypeForDatatype(datatype: number): string | null {
    switch (datatype) {
      case 1: case 2: case 3: case 5: case 6: case 7: // Int/UInt 8/16/32
      case 9: case 10: // Float, Double
        return 'number';
      case 4: case 8: case 13: // Int64, UInt64, DateTime
        return 'bigint';
      case 11: // Boolean
        return 'boolean';
      case 12: case 14: // String, Text
        return 'string';
      default:
        return null; // Complex types
    }
  }

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

    // Priority 3: Validate configuration
    this.validateConfiguration(nodes);
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

    // Subscribe to commands (NCMD/DCMD) for all running nodes
    this.subscribeToCommands(nodes);
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
   * Subscribe to NCMD/DCMD topics for all nodes
   * Implements Sparkplug B command reception capability
   */
  private subscribeToCommands(nodes: Map<string, SimulatedEoN>): void {
    if (!this.mqttClient) return;

    console.log('\n📥 Subscribing to command topics...');

    for (const [, node] of nodes) {
      if (node.state !== 'running') continue;

      // Subscribe to Node commands
      const ncmdTopic = `spBv1.0/${node.config.groupId}/NCMD/${node.config.edgeNodeId}/#`;
      this.mqttClient.subscribe(ncmdTopic, { qos: 0 }, (err) => {
        if (err) {
          console.error(`❌ Failed to subscribe to ${ncmdTopic}:`, err);
        } else {
          console.log(`✅ Subscribed to NCMD: ${ncmdTopic}`);
        }
      });

      // Subscribe to Device commands for each device
      if (node.devices && node.devices.length > 0) {
        for (const device of node.devices) {
          const dcmdTopic = `spBv1.0/${node.config.groupId}/DCMD/${node.config.edgeNodeId}/${device.deviceId}`;
          this.mqttClient.subscribe(dcmdTopic, { qos: 0 }, (err) => {
            if (err) {
              console.error(`❌ Failed to subscribe to ${dcmdTopic}:`, err);
            } else {
              console.log(`✅ Subscribed to DCMD: ${dcmdTopic}`);
            }
          });
        }
      }
    }

    // Setup message handler
    this.mqttClient.on('message', (topic, payload) => {
      this.handleCommand(topic, payload);
    });

    console.log('✅ Command subscriptions complete\n');
  }

  /**
   * Handle incoming NCMD/DCMD commands
   * Processes commands and updates metrics accordingly
   */
  private handleCommand(topic: string, payload: Buffer): void {
    try {
      console.log(`\n📥 Received command on topic: ${topic}`);

      // Decode the Sparkplug payload
      const decoded = decodePayload(payload);
      console.log(`   Decoded ${decoded.metrics?.length || 0} command metrics`);

      // Parse topic to identify node/device
      const topicParts = topic.split('/');
      const messageType = topicParts[2]; // NCMD or DCMD
      const edgeNodeId = topicParts[3];
      const deviceId = topicParts[4]; // undefined for NCMD

      if (!this.currentNodes) return;

      // Find the target node
      const targetNode = Array.from(this.currentNodes.values()).find(
        (node) => node.config.edgeNodeId === edgeNodeId
      );

      if (!targetNode) {
        console.warn(`⚠️  Node not found: ${edgeNodeId}`);
        return;
      }

      // Process metrics from command
      decoded.metrics?.forEach((metric) => {
        console.log(`   📝 Command metric: ${metric.name} = ${metric.value}`);

        // Check for rebirth command (handled separately)
        if (metric.name === 'Node Control/Rebirth' && metric.value === true) {
          console.log(`   🔄 Rebirth command received for ${edgeNodeId}`);
          this.handleRebirth(targetNode);
          return;
        }

        // For other commands, update the corresponding metric value
        // (This is a simplified implementation - production would need more logic)
        if (messageType === 'NCMD') {
          // Update node metric
          const nodeMetric = targetNode.metrics?.find((m) => m.name === metric.name);
          if (nodeMetric) {
            nodeMetric.value = metric.value as any;
            console.log(`   ✅ Updated node metric: ${metric.name}`);
          }
        } else if (messageType === 'DCMD' && deviceId) {
          // Update device metric
          const device = targetNode.devices.find((d) => d.deviceId === deviceId);
          if (device) {
            const deviceMetric = device.metrics?.find((m) => m.name === metric.name);
            if (deviceMetric) {
              deviceMetric.value = metric.value as any;
              console.log(`   ✅ Updated device metric: ${metric.name}`);
            }
          }
        }
      });
    } catch (error) {
      console.error(`❌ Error handling command:`, error);
    }
  }

  /**
   * Handle rebirth request
   * Re-publishes all BIRTH certificates with incremented bdSeq
   */
  private handleRebirth(node: SimulatedEoN): void {
    console.log(`\n🔄 Executing REBIRTH for ${node.config.edgeNodeId}...`);

    const nodeState = this.state.nodeStates.get(node.id);
    if (!nodeState) return;

    // Increment bdSeq (critical per Sparkplug B spec)
    nodeState.bdSeq = BigInt(Number(nodeState.bdSeq) + 1);
    console.log(`   New bdSeq: ${nodeState.bdSeq}`);

    // Re-publish NBIRTH
    this.publishNodeBirth(node);

    // Re-publish all DBIRTHs
    if (node.devices && node.devices.length > 0) {
      for (const device of node.devices) {
        this.publishDeviceBirth(node, device);
      }
    }

    console.log(`✅ REBIRTH complete for ${node.config.edgeNodeId}\n`);
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
      birthSent: false,
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
   * NOTE: Sparkplug B spec requires QoS 1 for BIRTH messages
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
      // Priority 3: Pass isBirth=true and entityId for alias optimization & history
      metrics: this.buildMetrics(node.metrics || [], 0, true, node.id),
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

    // Mark BIRTH as sent (for alias optimization)
    nodeState.birthSent = true;

    // CRITICAL: Sparkplug B spec REQUIRES QoS 1 for BIRTH messages
    this.publish(topic, payload, 1);
  }

  /**
   * Publish NDATA message
   */
  private publishNodeData(node: SimulatedEoN, currentTime: number): void {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const topic = `spBv1.0/${node.config.groupId}/NDATA/${node.config.edgeNodeId}`;

    const payload: SparkplugPayload = {
      timestamp: BigInt(Date.now()),
      // Priority 3: Pass isBirth=false and entityId for alias optimization & history
      metrics: this.buildMetrics(node.metrics || [], currentTime, false, node.id),
      seq: BigInt(this.incrementSeq(node.id)),
    };

    this.publish(topic, payload, node.config.network.qos);
  }

  /**
   * Publish NDEATH message
   * NOTE: Sparkplug B spec requires QoS 1 for DEATH messages
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

    // CRITICAL: Sparkplug B spec REQUIRES QoS 1 for DEATH messages
    this.publish(topic, payload, 1);
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
      birthSent: false,
    });
  }

  /**
   * Publish DBIRTH message
   * NOTE: Sparkplug B spec requires QoS 1 for BIRTH messages
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
      // Priority 3: Pass isBirth=true and entityId for alias optimization & history
      metrics: this.buildMetrics(device.metrics || [], 0, true, device.id),
      seq: BigInt(this.incrementDeviceSeq(device.id)),
    };

    // Mark BIRTH as sent (for alias optimization)
    deviceState.birthSent = true;

    // CRITICAL: Sparkplug B spec REQUIRES QoS 1 for BIRTH messages
    this.publish(topic, payload, 1);
  }

  /**
   * Publish DDATA message
   */
  private publishDeviceData(node: SimulatedEoN, device: any, currentTime: number): void {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const topic = `spBv1.0/${node.config.groupId}/DDATA/${node.config.edgeNodeId}/${device.deviceId}`;

    const payload: SparkplugPayload = {
      timestamp: BigInt(Date.now()),
      // Priority 3: Pass isBirth=false and entityId for alias optimization & history
      metrics: this.buildMetrics(device.metrics || [], currentTime, false, device.id),
      seq: BigInt(this.incrementDeviceSeq(device.id)),
    };

    this.publish(topic, payload, node.config.network.qos);
  }

  /**
   * Publish DDEATH message
   * NOTE: Sparkplug B spec requires QoS 1 for DEATH messages
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

    // CRITICAL: Sparkplug B spec REQUIRES QoS 1 for DEATH messages
    this.publish(topic, payload, 1);
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
   * Convert simple properties object to Sparkplug PropertySet
   * Based on ISO/IEC 20237:2023 (Sparkplug Specification)
   */
  private createPropertySet(props: {
    engineeringUnits?: string;
    description?: string;
    min?: number;
    max?: number;
  }): PropertySet {
    const keys: string[] = [];
    const values: PropertyValue[] = [];

    if (props.engineeringUnits !== undefined) {
      keys.push('engineeringUnits');
      values.push({
        type: 12, // String
        value: props.engineeringUnits,
      });
    }

    if (props.description !== undefined) {
      keys.push('description');
      values.push({
        type: 12, // String
        value: props.description,
      });
    }

    if (props.min !== undefined) {
      keys.push('min');
      values.push({
        type: 10, // Double
        value: props.min,
      });
    }

    if (props.max !== undefined) {
      keys.push('max');
      values.push({
        type: 10, // Double
        value: props.max,
      });
    }

    return { keys, values };
  }

  /**
   * Get default value for a Sparkplug B datatype
   * Used when metric value is null/undefined
   * Based on ISO/IEC 20237:2023 (Sparkplug Specification)
   */
  private getDefaultValueForDatatype(datatype: number): any {
    switch (datatype) {
      // Integer types
      case 1: // Int8
      case 2: // Int16
      case 3: // Int32
      case 5: // UInt8
      case 6: // UInt16
      case 7: // UInt32
        return 0;

      // 64-bit types (BigInt)
      case 4: // Int64
      case 8: // UInt64
      case 13: // DateTime (milliseconds since epoch as BigInt)
        return BigInt(0);

      // Floating point types
      case 9: // Float
      case 10: // Double
        return 0.0;

      // Boolean
      case 11: // Boolean
        return false;

      // String types
      case 12: // String
      case 14: // Text
        return '';

      // UUID
      case 15: // UUID
        return '00000000-0000-0000-0000-000000000000';

      // DataSet (complex structure)
      case 16: // DataSet
        return {
          numOfColumns: BigInt(0),
          columns: [],
          types: [],
          rows: [],
        };

      // Binary types
      case 17: // Bytes
        return new Uint8Array(0);

      case 18: // File
        return new Uint8Array(0);

      // Template (complex structure)
      case 19: // Template
        return {
          metrics: [],
        };

      // PropertySet (complex structure)
      case 20: // PropertySet
        return {
          keys: [],
          values: [],
        };

      case 21: // PropertySetList
        return [];

      // Array types
      case 22: // Int8Array
      case 23: // Int16Array
      case 24: // Int32Array
      case 26: // UInt8Array
      case 27: // UInt16Array
      case 28: // UInt32Array
      case 30: // FloatArray
      case 31: // DoubleArray
      case 32: // BooleanArray
      case 33: // StringArray
        return [];

      case 25: // Int64Array
      case 29: // UInt64Array
      case 34: // DateTimeArray
        return [];

      default:
        console.warn(`⚠️  Unknown Sparkplug datatype ${datatype}, defaulting to 0`);
        return 0;
    }
  }

  /**
   * Add metric value to history
   * Priority 3: Metric history tracking
   *
   * @param entityId - Node or device ID
   * @param metricName - Name of the metric
   * @param value - Metric value
   * @param datatype - Sparkplug datatype
   */
  private addToMetricHistory(
    entityId: string,
    metricName: string,
    value: any,
    datatype: number
  ): void {
    const historyKey = `${entityId}:${metricName}`;
    const entry: MetricHistoryEntry = {
      timestamp: BigInt(Date.now()),
      value,
      datatype,
    };

    let history = this.state.metricHistory.get(historyKey);
    if (!history) {
      history = [];
      this.state.metricHistory.set(historyKey, history);
    }

    // Add new entry
    history.push(entry);

    // Keep only last N entries
    if (history.length > this.state.maxHistoryEntries) {
      history.shift(); // Remove oldest entry
    }
  }

  /**
   * Get metric history for analysis
   * Priority 3: Metric history tracking
   *
   * @param entityId - Node or device ID
   * @param metricName - Name of the metric
   * @returns Array of historical values
   */
  public getMetricHistory(entityId: string, metricName: string): MetricHistoryEntry[] {
    const historyKey = `${entityId}:${metricName}`;
    return this.state.metricHistory.get(historyKey) || [];
  }

  /**
   * Clear metric history
   * Priority 3: Metric history tracking
   */
  public clearMetricHistory(): void {
    this.state.metricHistory.clear();
  }

  /**
   * Build metrics array from definitions
   * Returns strongly-typed SparkplugMetric array
   *
   * Priority 3 Features:
   * - Alias-only optimization: In DATA messages, use only alias (omit name) to reduce payload size
   * - Metric history tracking: Track historical values for analysis
   *
   * @param metricDefs - Metric definitions to build from
   * @param currentTime - Current simulation time
   * @param isBirth - Whether this is a BIRTH message (affects alias optimization)
   * @param entityId - Entity ID for history tracking (nodeId or deviceId)
   */
  private buildMetrics(
    metricDefs: MetricDefinition[],
    currentTime: number,
    isBirth: boolean = false,
    entityId?: string
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

      // Priority 3: Track metric history
      if (entityId && metricDef.name) {
        this.addToMetricHistory(entityId, metricDef.name, value, metricDef.datatype);
      }

      // Build strongly-typed SparkplugMetric (Sparkplug B compliant)
      const metric: SparkplugMetric = {
        timestamp: BigInt(Date.now()),
        datatype: metricDef.datatype,
        value,
      };

      // Priority 3: Alias optimization
      // In BIRTH messages: include both name and alias
      // In DATA messages: if alias exists, use only alias (omit name)
      if (isBirth) {
        // BIRTH: Always include name
        metric.name = metricDef.name;
        // Add optional alias (must be BigInt)
        if (metricDef.alias !== undefined) {
          metric.alias = typeof metricDef.alias === 'bigint'
            ? metricDef.alias
            : BigInt(metricDef.alias);
        }
      } else {
        // DATA: Use alias-only optimization if alias is defined
        if (metricDef.alias !== undefined) {
          // Alias-only (no name) - reduces payload size per Sparkplug B spec
          metric.alias = typeof metricDef.alias === 'bigint'
            ? metricDef.alias
            : BigInt(metricDef.alias);
          // Note: name is intentionally omitted for optimization
        } else {
          // No alias defined, must include name
          metric.name = metricDef.name;
        }
      }

      // Add optional properties (convert to Sparkplug PropertySet)
      if (metricDef.properties) {
        const propertySet = this.createPropertySet(metricDef.properties);
        // Only add if we have properties
        if (propertySet.keys.length > 0) {
          metric.properties = propertySet;
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
      const payloadForLog = JSON.stringify(payload, (_key, value) =>
        typeof value === 'bigint' ? value.toString() + 'n' : value
      );
      console.log(`   📦 Payload structure:`, payloadForLog);

      // Cast to any to work around type incompatibility with @sparkplug/codec
      // Our SparkplugPayload is compatible but TypeScript doesn't recognize it
      const encodedPayload = encodePayload(payload as any);
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
