// YAML Configuration Loader with Validation
// Loads and validates sparkplug.yaml configuration

import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import Ajv from 'ajv';
import type { JSONSchemaType } from 'ajv';

export interface SparkplugConfig {
  sparkplug: {
    version: string;
  };
  mqtt: {
    ports: {
      tcp: number;
      tcp_tls: number;
      ws: number;
      wss: number;
    };
    tls: {
      enabled: boolean;
      cert_path: string;
      key_path: string;
      ca_path: string;
    };
    limits: {
      max_clients: number;
      max_packet_size: number;
      max_qos_0_mem: number;
      max_qos_1_2_mem: number;
    };
  };
  compliant_broker: {
    mqtt: {
      protocols: string[];
      qos_levels: number[];
    };
    retained_messages: {
      enabled: boolean;
      max_per_topic: number;
      max_total: number;
    };
    last_will: {
      enabled: boolean;
      qos_enforcement: number;
      retain_enforcement: boolean;
      validate_payload: boolean;
    };
    session_management: {
      clean_session_enforcement: boolean;
      clean_start_enforcement: boolean;
      session_expiry: number;
    };
    wildcards: {
      single_level: boolean;
      multi_level: boolean;
    };
  };
  aware_broker: {
    enabled: boolean;
    birth_certificate_storage: {
      enabled: boolean;
      storage_backend: string;
      redis_key_prefix: string;
      retention_policy: {
        max_age_hours: number;
        max_per_node: number;
      };
    };
    certificate_topics: {
      enabled: boolean;
      namespace_prefix: string;
      retain: boolean;
      qos: number;
    };
    ndeath_timestamp_update: {
      enabled: boolean;
      update_on_disconnect: boolean;
      use_broker_time: boolean;
    };
    sequence_validation: {
      enabled: boolean;
      enforce_bdseq_matching: boolean;
      enforce_seq_ordering: boolean;
      reject_invalid: boolean;
      log_violations: boolean;
    };
    state_management: {
      track_node_states: boolean;
      track_device_states: boolean;
      heartbeat_monitoring: boolean;
      heartbeat_timeout_ms: number;
    };
  };
  scada: {
    host_application: {
      enabled: boolean;
      primary_host: {
        enabled: boolean;
        host_id: string;
        is_primary: boolean;
      };
      state_management: {
        enabled: boolean;
        topic_format: string;
        message_format: string;
        qos: number;
        retain: boolean;
        publish_interval_ms: number;
        publish_on_connect: boolean;
        publish_on_disconnect: boolean;
      };
      birth_monitoring: {
        subscribe_to_births: boolean;
        auto_discovery: boolean;
      };
      command_interface: {
        enabled: boolean;
        authorized_groups: string[];
        rate_limiting: {
          max_commands_per_minute: number;
        };
      };
      data_subscription: {
        auto_subscribe: boolean;
        rbe_detection: {
          enabled: boolean;
          track_changes: boolean;
        };
      };
      store_and_forward: {
        enabled: boolean;
        storage_backend: string;
        max_queue_size: number;
        flush_on_reconnect: boolean;
      };
    };
  };
  telemetry: {
    opentelemetry: {
      enabled: boolean;
      service_name: string;
      metrics: {
        enabled: boolean;
        port: number;
        path: string;
      };
      traces: {
        enabled: boolean;
        sample_rate: number;
      };
    };
    logging: {
      level: string;
      pretty: boolean;
      destination: string;
      audit_log: {
        enabled: boolean;
        log_commands: boolean;
        log_births: boolean;
        log_deaths: boolean;
      };
    };
  };
  storage: {
    redis: {
      host: string;
      port: number;
      db: number;
      password: string | null;
    };
    sqlite: {
      enabled: boolean;
      path: string;
      wal_mode: boolean;
    };
  };
}

export class ConfigLoader {
  private config: SparkplugConfig;

  constructor(configPath: string = './config/sparkplug.yaml') {
    const yaml = readFileSync(configPath, 'utf8');
    this.config = parse(yaml) as SparkplugConfig;
    this.validate();
  }

  private validate(): void {
    // Basic validation
    if (!this.config.sparkplug?.version) {
      throw new Error('sparkplug.version is required');
    }

    const versionPattern = /^spB?v\d+\.\d+$/;
    if (!versionPattern.test(this.config.sparkplug.version)) {
      throw new Error(
        `Invalid sparkplug version format: ${this.config.sparkplug.version}. Expected: spBvX.Y`
      );
    }
  }

  get(): SparkplugConfig {
    return this.config;
  }

  get sparkplugVersion(): string {
    return this.config.sparkplug.version;
  }

  get namespacePrefix(): string {
    return this.config.sparkplug.version;
  }

  // Helper methods
  validateTopic(topic: string): boolean {
    const prefix = this.namespacePrefix;
    return topic.startsWith(`${prefix}/`) || topic.startsWith('$sparkplug/');
  }

  isAwareEnabled(): boolean {
    return this.config.aware_broker.enabled;
  }

  isSCADAEnabled(): boolean {
    return this.config.scada.host_application.enabled;
  }

  getRedisConfig() {
    return this.config.storage.redis;
  }

  getMQTTConfig() {
    return this.config.mqtt;
  }
}
