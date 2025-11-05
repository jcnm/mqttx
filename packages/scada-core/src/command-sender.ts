// Command Sender
// Sends NCMD and DCMD messages to nodes and devices

import type mqtt from 'mqtt';
import {
  buildNodeCommandTopic,
  buildDeviceCommandTopic,
} from '@sparkplug/namespace';
import {
  encodePayload,
  createNDataPayload,
  createRebirthMetric,
  type Metric,
} from '@sparkplug/codec';

export interface NodeCommandOptions {
  groupId: string;
  edgeNodeId: string;
  metrics: Metric[];
  namespace?: string;
}

export interface DeviceCommandOptions extends NodeCommandOptions {
  deviceId: string;
}

export class CommandSender {
  private client: mqtt.MqttClient;
  private namespace: string;

  constructor(client: mqtt.MqttClient, namespace = 'spBv1.0') {
    this.client = client;
    this.namespace = namespace;
  }

  /**
   * Send NCMD (Node Command)
   */
  sendNodeCommand(options: NodeCommandOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const topic = buildNodeCommandTopic({
        namespace: options.namespace || this.namespace,
        groupId: options.groupId,
        edgeNodeId: options.edgeNodeId,
      });

      const payload = createNDataPayload(0n, options.metrics);
      const encoded = encodePayload(payload);

      this.client.publish(topic, Buffer.from(encoded), { qos: 0 }, (err) => {
        if (err) {
          console.error('Error sending NCMD:', err);
          reject(err);
        } else {
          console.log(`📤 NCMD sent to ${options.groupId}/${options.edgeNodeId}`);
          resolve();
        }
      });
    });
  }

  /**
   * Send DCMD (Device Command)
   */
  sendDeviceCommand(options: DeviceCommandOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const topic = buildDeviceCommandTopic({
        namespace: options.namespace || this.namespace,
        groupId: options.groupId,
        edgeNodeId: options.edgeNodeId,
        deviceId: options.deviceId,
      });

      const payload = createNDataPayload(0n, options.metrics);
      const encoded = encodePayload(payload);

      this.client.publish(topic, Buffer.from(encoded), { qos: 0 }, (err) => {
        if (err) {
          console.error('Error sending DCMD:', err);
          reject(err);
        } else {
          console.log(
            `📤 DCMD sent to ${options.groupId}/${options.edgeNodeId}/${options.deviceId}`
          );
          resolve();
        }
      });
    });
  }

  /**
   * Request node rebirth
   */
  requestRebirth(groupId: string, edgeNodeId: string): Promise<void> {
    const rebirthMetric = createRebirthMetric();

    return this.sendNodeCommand({
      groupId,
      edgeNodeId,
      metrics: [rebirthMetric],
    });
  }
}
