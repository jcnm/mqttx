/**
 * SCADA Command Service
 * Implements NCMD/DCMD and Rebirth Request
 * ISO/IEC 20237:2023 Section 8 - Commands
 */

import type { Metric } from '@sparkplug/codec';
import { encodePayload } from '@sparkplug/codec';
import type { SparkplugBroker } from '../mqtt/broker.js';

export interface CommandOptions {
  groupId: string;
  edgeNodeId: string;
  deviceId?: string;
  metrics: Metric[];
}

export interface RebirthOptions {
  groupId: string;
  edgeNodeId: string;
}

export class CommandService {
  constructor(private broker: SparkplugBroker) {}

  /**
   * Send NCMD (Node Command)
   * Topic: spBv1.0/{groupId}/NCMD/{edgeNodeId}
   */
  async sendNodeCommand(options: CommandOptions): Promise<void> {
    const { groupId, edgeNodeId, metrics } = options;

    if (options.deviceId) {
      throw new Error('NCMD cannot target a device. Use sendDeviceCommand instead.');
    }

    const topic = `spBv1.0/${groupId}/NCMD/${edgeNodeId}`;

    const payload = encodePayload({
      timestamp: BigInt(Date.now()),
      metrics,
      seq: BigInt(0), // Commands don't use sequence numbers
    });

    await this.publishCommand(topic, payload);

    console.log(`✅ NCMD sent to ${groupId}/${edgeNodeId}`);
  }

  /**
   * Send DCMD (Device Command)
   * Topic: spBv1.0/{groupId}/DCMD/{edgeNodeId}/{deviceId}
   */
  async sendDeviceCommand(options: CommandOptions): Promise<void> {
    const { groupId, edgeNodeId, deviceId, metrics } = options;

    if (!deviceId) {
      throw new Error('DCMD requires a deviceId. Use sendNodeCommand for node commands.');
    }

    const topic = `spBv1.0/${groupId}/DCMD/${edgeNodeId}/${deviceId}`;

    const payload = encodePayload({
      timestamp: BigInt(Date.now()),
      metrics,
      seq: BigInt(0), // Commands don't use sequence numbers
    });

    await this.publishCommand(topic, payload);

    console.log(`✅ DCMD sent to ${groupId}/${edgeNodeId}/${deviceId}`);
  }

  /**
   * Request Node Rebirth
   * Sends NCMD with "Node Control/Rebirth" = true
   * ISO/IEC 20237:2023 Section 8.2.9
   */
  async requestRebirth(options: RebirthOptions): Promise<void> {
    const { groupId, edgeNodeId } = options;

    const rebirthMetric: Metric = {
      name: 'Node Control/Rebirth',
      value: true,
      datatype: 11, // Boolean
      timestamp: BigInt(Date.now()),
    };

    await this.sendNodeCommand({
      groupId,
      edgeNodeId,
      metrics: [rebirthMetric],
    });

    console.log(`✅ Rebirth requested for ${groupId}/${edgeNodeId}`);
  }

  /**
   * Request Device Rebirth
   * Sends DCMD with "Device Control/Rebirth" = true
   */
  async requestDeviceRebirth(
    groupId: string,
    edgeNodeId: string,
    deviceId: string
  ): Promise<void> {
    const rebirthMetric: Metric = {
      name: 'Device Control/Rebirth',
      value: true,
      datatype: 11, // Boolean
      timestamp: BigInt(Date.now()),
    };

    await this.sendDeviceCommand({
      groupId,
      edgeNodeId,
      deviceId,
      metrics: [rebirthMetric],
    });

    console.log(`✅ Rebirth requested for ${groupId}/${edgeNodeId}/${deviceId}`);
  }

  /**
   * Request Node Reboot
   * Sends NCMD with "Node Control/Reboot" = true
   */
  async requestReboot(options: RebirthOptions): Promise<void> {
    const { groupId, edgeNodeId } = options;

    const rebootMetric: Metric = {
      name: 'Node Control/Reboot',
      value: true,
      datatype: 11, // Boolean
      timestamp: BigInt(Date.now()),
    };

    await this.sendNodeCommand({
      groupId,
      edgeNodeId,
      metrics: [rebootMetric],
    });

    console.log(`✅ Reboot requested for ${groupId}/${edgeNodeId}`);
  }

  /**
   * Send command to write a metric value
   */
  async writeMetric(
    groupId: string,
    edgeNodeId: string,
    metricName: string,
    value: number | string | boolean | bigint,
    datatype: number,
    deviceId?: string
  ): Promise<void> {
    const metric: Metric = {
      name: metricName,
      value,
      datatype,
      timestamp: BigInt(Date.now()),
    };

    if (deviceId) {
      await this.sendDeviceCommand({
        groupId,
        edgeNodeId,
        deviceId,
        metrics: [metric],
      });
    } else {
      await this.sendNodeCommand({
        groupId,
        edgeNodeId,
        metrics: [metric],
      });
    }

    console.log(`✅ Write command sent: ${metricName} = ${value}`);
  }

  /**
   * Publish command to broker
   */
  private async publishCommand(topic: string, payload: Uint8Array): Promise<void> {
    const aedes = this.broker.getAedes();

    return new Promise((resolve, reject) => {
      aedes.publish(
        {
          cmd: 'publish',
          topic,
          payload: Buffer.from(payload),
          qos: 0,
          retain: false,
          dup: false,
        },
        (error) => {
          if (error) {
            console.error(`❌ Failed to publish command to ${topic}:`, error);
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }
}
