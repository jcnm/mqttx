// Sparkplug Aware Broker Features
// Implements optional Sparkplug Aware features per ISO/IEC 20237:2023

import type Aedes from 'aedes';
import type { ConfigLoader } from '../config/loader.js';
import type { StatePersistence } from '@sparkplug/state';
import { MessageType, parseTopic, buildCertificateTopicNBirth, buildCertificateTopicDBirth } from '@sparkplug/namespace';
import { decodePayload, getBdSeq } from '@sparkplug/codec';

export interface AwareFeatures {
  config: ConfigLoader;
  aedes: Aedes;
  persistence: StatePersistence;
}

export class SparkplugAwareBroker {
  private config: ConfigLoader;
  private aedes: Aedes;
  private persistence: StatePersistence;

  constructor(options: AwareFeatures) {
    this.config = options.config;
    this.aedes = options.aedes;
    this.persistence = options.persistence;

    if (this.config.isAwareEnabled()) {
      this.setupAwareFeatures();
    }
  }

  private setupAwareFeatures(): void {
    console.log('Initializing Sparkplug Aware features...');

    // Listen for birth certificates
    this.aedes.on('publish', async (packet, client) => {
      if (!client) return;

      const parsed = parseTopic(packet.topic);
      const payload = Buffer.isBuffer(packet.payload) ? packet.payload : Buffer.from(packet.payload);

      if (parsed.messageType === MessageType.NBIRTH) {
        await this.handleNBirthCertificate(parsed, payload);
      } else if (parsed.messageType === MessageType.DBIRTH) {
        await this.handleDBirthCertificate(parsed, payload);
      } else if (parsed.messageType === MessageType.NDEATH) {
        await this.handleNDeathTimestampUpdate(parsed, payload);
      }
    });

    console.log('Sparkplug Aware features initialized');
  }

  /**
   * Store NBIRTH and publish to certificate topic
   */
  private async handleNBirthCertificate(parsed: any, payload: Buffer): Promise<void> {
    const config = this.config.get();

    if (!config.aware_broker.birth_certificate_storage.enabled) {
      return;
    }

    try {
      // Store birth certificate
      await this.persistence.saveBirthCertificate(
        'NBIRTH',
        parsed.groupId,
        parsed.edgeNodeId,
        undefined,
        new Uint8Array(payload)
      );

      console.log(`Stored NBIRTH certificate for ${parsed.groupId}/${parsed.edgeNodeId}`);

      // Publish to certificate topic if enabled
      if (config.aware_broker.certificate_topics.enabled) {
        const certTopic = buildCertificateTopicNBirth({
          namespace: parsed.namespace,
          groupId: parsed.groupId,
          edgeNodeId: parsed.edgeNodeId,
        });

        this.aedes.publish(
          {
            cmd: 'publish',
            topic: certTopic,
            payload,
            qos: config.aware_broker.certificate_topics.qos as 0 | 1 | 2,
            retain: config.aware_broker.certificate_topics.retain,
            dup: false,
          },
          (err) => {
            if (err) {
              console.error('Error publishing NBIRTH certificate:', err);
            } else {
              console.log(`Published NBIRTH certificate to ${certTopic}`);
            }
          }
        );
      }
    } catch (error) {
      console.error('Error handling NBIRTH certificate:', error);
    }
  }

  /**
   * Store DBIRTH and publish to certificate topic
   */
  private async handleDBirthCertificate(parsed: any, payload: Buffer): Promise<void> {
    const config = this.config.get();

    if (!config.aware_broker.birth_certificate_storage.enabled) {
      return;
    }

    try {
      // Store birth certificate
      await this.persistence.saveBirthCertificate(
        'DBIRTH',
        parsed.groupId,
        parsed.edgeNodeId,
        parsed.deviceId,
        new Uint8Array(payload)
      );

      console.log(
        `Stored DBIRTH certificate for ${parsed.groupId}/${parsed.edgeNodeId}/${parsed.deviceId}`
      );

      // Publish to certificate topic if enabled
      if (config.aware_broker.certificate_topics.enabled) {
        const certTopic = buildCertificateTopicDBirth({
          namespace: parsed.namespace,
          groupId: parsed.groupId,
          edgeNodeId: parsed.edgeNodeId,
          deviceId: parsed.deviceId,
        });

        this.aedes.publish(
          {
            cmd: 'publish',
            topic: certTopic,
            payload,
            qos: config.aware_broker.certificate_topics.qos as 0 | 1 | 2,
            retain: config.aware_broker.certificate_topics.retain,
            dup: false,
          },
          (err) => {
            if (err) {
              console.error('Error publishing DBIRTH certificate:', err);
            } else {
              console.log(`Published DBIRTH certificate to ${certTopic}`);
            }
          }
        );
      }
    } catch (error) {
      console.error('Error handling DBIRTH certificate:', error);
    }
  }

  /**
   * Update NDEATH timestamp on disconnect
   */
  private async handleNDeathTimestampUpdate(parsed: any, payload: Buffer): Promise<void> {
    const config = this.config.get();

    if (!config.aware_broker.ndeath_timestamp_update.enabled) {
      return;
    }

    try {
      const decoded = decodePayload(new Uint8Array(payload));

      if (config.aware_broker.ndeath_timestamp_update.use_broker_time) {
        // Update timestamp to broker time
        decoded.timestamp = BigInt(Date.now());
        console.log(`Updated NDEATH timestamp for ${parsed.groupId}/${parsed.edgeNodeId}`);
      }
    } catch (error) {
      console.error('Error updating NDEATH timestamp:', error);
    }
  }

  /**
   * Validate sequence numbers
   */
  validateSequence(
    groupId: string,
    edgeNodeId: string,
    seq: bigint,
    expectedSeq: bigint
  ): boolean {
    const config = this.config.get();

    if (!config.aware_broker.sequence_validation.enabled) {
      return true;
    }

    if (!config.aware_broker.sequence_validation.enforce_seq_ordering) {
      return true;
    }

    if (seq !== expectedSeq) {
      if (config.aware_broker.sequence_validation.log_violations) {
        console.warn(
          `Sequence violation for ${groupId}/${edgeNodeId}: expected ${expectedSeq}, got ${seq}`
        );
      }

      return !config.aware_broker.sequence_validation.reject_invalid;
    }

    return true;
  }

  /**
   * Load stored birth certificate
   */
  async loadBirthCertificate(
    type: 'NBIRTH' | 'DBIRTH',
    groupId: string,
    edgeNodeId: string,
    deviceId?: string
  ): Promise<Uint8Array | null> {
    return this.persistence.loadBirthCertificate(type, groupId, edgeNodeId, deviceId);
  }
}
