// STATE Message Publisher
// Publishes Primary Host STATE messages

import type mqtt from 'mqtt';
import { buildStateTopic } from '@sparkplug/namespace';
import { createStatePayload } from '@sparkplug/codec';

export interface StatePublisherOptions {
  client: mqtt.MqttClient;
  hostId: string;
  namespace?: string;
  publishInterval?: number;
}

export class StatePublisher {
  private client: mqtt.MqttClient;
  private hostId: string;
  private namespace: string;
  private publishInterval: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(options: StatePublisherOptions) {
    this.client = options.client;
    this.hostId = options.hostId;
    this.namespace = options.namespace || 'spBv1.0';
    this.publishInterval = options.publishInterval || 30000;
  }

  start(): void {
    // Publish immediately
    this.publish(true);

    // Start periodic publishing
    this.timer = setInterval(() => {
      this.publish(true);
    }, this.publishInterval);

    console.log(
      `✅ STATE publisher started (interval: ${this.publishInterval}ms)`
    );
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Publish offline STATE
    this.publish(false);

    console.log('✅ STATE publisher stopped');
  }

  publish(online: boolean): void {
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
          console.log(
            `📡 STATE published: ${online ? 'ONLINE' : 'OFFLINE'} on ${topic}`
          );
        }
      }
    );
  }
}
