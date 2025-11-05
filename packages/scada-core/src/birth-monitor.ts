// Birth Monitor
// Monitors and auto-discovers nodes and devices via NBIRTH/DBIRTH

import type mqtt from 'mqtt';
import {
  buildAllNodeBirthsSubscription,
  buildAllDeviceBirthsSubscription,
  parseTopic,
  MessageType,
} from '@sparkplug/namespace';
import { decodePayload, getBdSeq, type DecodedPayload } from '@sparkplug/codec';

export interface NodeBirth {
  groupId: string;
  edgeNodeId: string;
  bdSeq: bigint;
  timestamp: bigint;
  metrics: DecodedPayload['metrics'];
}

export interface DeviceBirth {
  groupId: string;
  edgeNodeId: string;
  deviceId: string;
  timestamp: bigint;
  metrics: DecodedPayload['metrics'];
}

export type BirthCallback = (birth: NodeBirth | DeviceBirth) => void;

export class BirthMonitor {
  private client: mqtt.MqttClient;
  private namespace: string;
  private callbacks: Set<BirthCallback> = new Set();
  private discoveredNodes: Map<string, NodeBirth> = new Map();
  private discoveredDevices: Map<string, DeviceBirth> = new Map();

  constructor(client: mqtt.MqttClient, namespace = 'spBv1.0') {
    this.client = client;
    this.namespace = namespace;
  }

  start(): void {
    const topics = [
      buildAllNodeBirthsSubscription(this.namespace),
      buildAllDeviceBirthsSubscription(this.namespace),
    ];

    this.client.subscribe(topics, { qos: 0 }, (err) => {
      if (err) {
        console.error('Error subscribing to births:', err);
      } else {
        console.log('✅ Birth monitor subscribed to:', topics);
      }
    });

    this.client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload);
    });
  }

  private handleMessage(topic: string, payload: Buffer): void {
    const parsed = parseTopic(topic);

    if (!parsed.isValid) return;

    try {
      const decoded = decodePayload(new Uint8Array(payload));

      if (parsed.messageType === MessageType.NBIRTH) {
        this.handleNodeBirth(parsed, decoded);
      } else if (parsed.messageType === MessageType.DBIRTH) {
        this.handleDeviceBirth(parsed, decoded);
      }
    } catch (error) {
      console.error('Error processing birth message:', error);
    }
  }

  private handleNodeBirth(parsed: any, payload: DecodedPayload): void {
    const bdSeq = getBdSeq(payload);

    if (bdSeq === null || !parsed.groupId || !parsed.edgeNodeId) {
      console.warn('Invalid NBIRTH message');
      return;
    }

    const birth: NodeBirth = {
      groupId: parsed.groupId,
      edgeNodeId: parsed.edgeNodeId,
      bdSeq,
      timestamp: payload.timestamp || BigInt(Date.now()),
      metrics: payload.metrics,
    };

    const key = `${parsed.groupId}/${parsed.edgeNodeId}`;
    this.discoveredNodes.set(key, birth);

    console.log(
      `🎉 Node discovered: ${parsed.groupId}/${parsed.edgeNodeId} (bdSeq: ${bdSeq})`
    );

    // Notify callbacks
    this.callbacks.forEach((callback) => callback(birth));
  }

  private handleDeviceBirth(parsed: any, payload: DecodedPayload): void {
    if (!parsed.groupId || !parsed.edgeNodeId || !parsed.deviceId) {
      console.warn('Invalid DBIRTH message');
      return;
    }

    const birth: DeviceBirth = {
      groupId: parsed.groupId,
      edgeNodeId: parsed.edgeNodeId,
      deviceId: parsed.deviceId,
      timestamp: payload.timestamp || BigInt(Date.now()),
      metrics: payload.metrics,
    };

    const key = `${parsed.groupId}/${parsed.edgeNodeId}/${parsed.deviceId}`;
    this.discoveredDevices.set(key, birth);

    console.log(
      `🎉 Device discovered: ${parsed.groupId}/${parsed.edgeNodeId}/${parsed.deviceId}`
    );

    // Notify callbacks
    this.callbacks.forEach((callback) => callback(birth));
  }

  onBirth(callback: BirthCallback): void {
    this.callbacks.add(callback);
  }

  offBirth(callback: BirthCallback): void {
    this.callbacks.delete(callback);
  }

  getDiscoveredNodes(): NodeBirth[] {
    return Array.from(this.discoveredNodes.values());
  }

  getDiscoveredDevices(): DeviceBirth[] {
    return Array.from(this.discoveredDevices.values());
  }

  getNode(groupId: string, edgeNodeId: string): NodeBirth | null {
    return this.discoveredNodes.get(`${groupId}/${edgeNodeId}`) || null;
  }

  getDevice(
    groupId: string,
    edgeNodeId: string,
    deviceId: string
  ): DeviceBirth | null {
    return this.discoveredDevices.get(`${groupId}/${edgeNodeId}/${deviceId}`) || null;
  }
}
