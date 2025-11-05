// Data Subscriber
// Subscribes to NDATA/DDATA and implements Report by Exception (RBE) detection

import type mqtt from 'mqtt';
import { parseTopic, MessageType } from '@sparkplug/namespace';
import { decodePayload, type DecodedPayload, type Metric } from '@sparkplug/codec';

export interface DataUpdate {
  groupId: string;
  edgeNodeId: string;
  deviceId?: string;
  timestamp: bigint;
  seq?: bigint;
  metrics: DecodedPayload['metrics'];
}

export type DataCallback = (update: DataUpdate) => void;

export class DataSubscriber {
  private client: mqtt.MqttClient;
  private namespace: string;
  private callbacks: Set<DataCallback> = new Set();
  private lastValues: Map<string, Map<string, any>> = new Map(); // For RBE
  private rbeEnabled: boolean;

  constructor(
    client: mqtt.MqttClient,
    namespace = 'spBv1.0',
    rbeEnabled = true
  ) {
    this.client = client;
    this.namespace = namespace;
    this.rbeEnabled = rbeEnabled;
  }

  start(): void {
    // Subscribe to all NDATA and DDATA messages
    const topics = [
      `${this.namespace}/+/NDATA/+`,
      `${this.namespace}/+/DDATA/+/+`,
    ];

    this.client.subscribe(topics, { qos: 0 }, (err) => {
      if (err) {
        console.error('Error subscribing to data:', err);
      } else {
        console.log('✅ Data subscriber subscribed to:', topics);
      }
    });

    this.client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload);
    });
  }

  private handleMessage(topic: string, payload: Buffer): void {
    const parsed = parseTopic(topic);

    if (!parsed.isValid) return;

    if (
      parsed.messageType !== MessageType.NDATA &&
      parsed.messageType !== MessageType.DDATA
    ) {
      return;
    }

    try {
      const decoded = decodePayload(new Uint8Array(payload));

      const update: DataUpdate = {
        groupId: parsed.groupId!,
        edgeNodeId: parsed.edgeNodeId!,
        deviceId: parsed.deviceId,
        timestamp: decoded.timestamp || BigInt(Date.now()),
        seq: decoded.seq,
        metrics: decoded.metrics,
      };

      // Process RBE if enabled
      if (this.rbeEnabled) {
        this.processRBE(update);
      }

      // Notify callbacks
      this.callbacks.forEach((callback) => callback(update));
    } catch (error) {
      console.error('Error processing data message:', error);
    }
  }

  private processRBE(update: DataUpdate): void {
    const key = update.deviceId
      ? `${update.groupId}/${update.edgeNodeId}/${update.deviceId}`
      : `${update.groupId}/${update.edgeNodeId}`;

    let lastValues = this.lastValues.get(key);
    if (!lastValues) {
      lastValues = new Map();
      this.lastValues.set(key, lastValues);
    }

    // Track metric changes
    update.metrics?.forEach((metric) => {
      if (!metric.name) return;

      const lastValue = lastValues.get(metric.name);
      const currentValue = metric.value;

      if (lastValue !== currentValue) {
        console.log(
          `📊 RBE: ${key}/${metric.name} changed from ${lastValue} to ${currentValue}`
        );
        lastValues.set(metric.name, currentValue);
      }
    });
  }

  onData(callback: DataCallback): void {
    this.callbacks.add(callback);
  }

  offData(callback: DataCallback): void {
    this.callbacks.delete(callback);
  }

  getLastValue(
    groupId: string,
    edgeNodeId: string,
    deviceId: string | undefined,
    metricName: string
  ): any {
    const key = deviceId
      ? `${groupId}/${edgeNodeId}/${deviceId}`
      : `${groupId}/${edgeNodeId}`;

    const lastValues = this.lastValues.get(key);
    return lastValues?.get(metricName);
  }
}
