// Primary Host Application
// Implements Sparkplug Primary Host per ISO/IEC 20237:2023

import mqtt from 'mqtt';
import { buildStateTopic, buildAllNodeBirthsSubscription, buildAllDeviceBirthsSubscription } from '@sparkplug/namespace';
import { createStatePayload } from '@sparkplug/codec';
import type { StatePublisher } from './state-publisher.js';
import type { BirthMonitor } from './birth-monitor.js';
import type { CommandSender } from './command-sender.js';

export interface PrimaryHostOptions {
  brokerUrl: string;
  hostId: string;
  namespace?: string;
  publishInterval?: number;
}

export class PrimaryHostApplication {
  private client: mqtt.MqttClient | null = null;
  private hostId: string;
  private namespace: string;
  private brokerUrl: string;
  private publishInterval: number;
  private statePublishTimer: NodeJS.Timeout | null = null;
  private online = false;

  constructor(options: PrimaryHostOptions) {
    this.hostId = options.hostId;
    this.namespace = options.namespace || 'spBv1.0';
    this.brokerUrl = options.brokerUrl;
    this.publishInterval = options.publishInterval || 30000; // 30 seconds
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.brokerUrl, {
        clientId: this.hostId,
        clean: true,
        will: {
          topic: buildStateTopic(this.hostId, this.namespace),
          payload: createStatePayload(false),
          qos: 1,
          retain: true,
        },
      });

      this.client.on('connect', () => {
        console.log(`✅ Primary Host ${this.hostId} connected to broker`);
        this.online = true;

        // Publish online STATE
        this.publishState(true);

        // Start periodic STATE publishing
        this.startStatePublishing();

        // Subscribe to birth messages
        this.subscribeTobirths();

        resolve();
      });

      this.client.on('error', (error) => {
        console.error('MQTT connection error:', error);
        reject(error);
      });

      this.client.on('close', () => {
        console.log('MQTT connection closed');
        this.online = false;
      });

      this.client.on('offline', () => {
        console.log('MQTT client offline');
        this.online = false;
      });
    });
  }

  private publishState(online: boolean): void {
    if (!this.client) return;

    const topic = buildStateTopic(this.hostId, this.namespace);
    const payload = createStatePayload(online);

    this.client.publish(
      topic,
      payload,
      { qos: 1, retain: true },
      (err) => {
        if (err) {
          console.error('Error publishing STATE:', err);
        } else {
          console.log(`📡 Published STATE: ${online ? 'ONLINE' : 'OFFLINE'}`);
        }
      }
    );
  }

  private startStatePublishing(): void {
    if (this.statePublishTimer) {
      clearInterval(this.statePublishTimer);
    }

    this.statePublishTimer = setInterval(() => {
      if (this.online) {
        this.publishState(true);
      }
    }, this.publishInterval);
  }

  private subscribeTobirths(): void {
    if (!this.client) return;

    const topics = [
      buildAllNodeBirthsSubscription(this.namespace),
      buildAllDeviceBirthsSubscription(this.namespace),
    ];

    this.client.subscribe(topics, { qos: 0 }, (err) => {
      if (err) {
        console.error('Error subscribing to births:', err);
      } else {
        console.log('✅ Subscribed to birth messages:', topics);
      }
    });

    // Handle incoming birth messages
    this.client.on('message', (topic, payload) => {
      if (topic.includes('/NBIRTH/')) {
        console.log(`📥 Received NBIRTH from ${topic}`);
      } else if (topic.includes('/DBIRTH/')) {
        console.log(`📥 Received DBIRTH from ${topic}`);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.statePublishTimer) {
      clearInterval(this.statePublishTimer);
      this.statePublishTimer = null;
    }

    if (this.client) {
      // Publish offline STATE before disconnecting
      this.publishState(false);

      return new Promise((resolve) => {
        this.client!.end(true, () => {
          console.log('✅ Primary Host disconnected');
          resolve();
        });
      });
    }
  }

  getClient(): mqtt.MqttClient | null {
    return this.client;
  }

  isOnline(): boolean {
    return this.online;
  }

  getHostId(): string {
    return this.hostId;
  }
}
