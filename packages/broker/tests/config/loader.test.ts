import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigLoader } from '../../src/config/loader.js';
import { readFileSync } from 'node:fs';

// Mock fs
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

describe('Config Loader', () => {
  const validYaml = `
sparkplug:
  version: spBv1.0

mqtt:
  ports:
    tcp: 1883
    tcp_tls: 8883
    ws: 9001
    wss: 9002
  tls:
    enabled: false
    cert_path: ./certs/server.crt
    key_path: ./certs/server.key
    ca_path: ./certs/ca.crt
  limits:
    max_clients: 1000
    max_packet_size: 268435456
    max_qos_0_mem: 104857600
    max_qos_1_2_mem: 104857600

compliant_broker:
  mqtt:
    protocols: [mqtt, mqtts, ws, wss]
    qos_levels: [0, 1, 2]
  retained_messages:
    enabled: true
    max_per_topic: 1
    max_total: 10000
  last_will:
    enabled: true
    qos_enforcement: 0
    retain_enforcement: false
    validate_payload: true
  session_management:
    clean_session_enforcement: true
    clean_start_enforcement: true
    session_expiry: 0
  wildcards:
    single_level: true
    multi_level: true

aware_broker:
  enabled: true
  birth_certificate_storage:
    enabled: true
    storage_backend: redis
    redis_key_prefix: "sparkplug:certs:"
    retention_policy:
      max_age_hours: 720
      max_per_node: 100
  certificate_topics:
    enabled: true
    namespace_prefix: "$sparkplug/certificates"
    retain: true
    qos: 1
  ndeath_timestamp_update:
    enabled: true
    update_on_disconnect: true
    use_broker_time: true
  sequence_validation:
    enabled: true
    enforce_bdseq_matching: true
    enforce_seq_ordering: true
    reject_invalid: false
    log_violations: true
  state_management:
    track_node_states: true
    track_device_states: true
    heartbeat_monitoring: true
    heartbeat_timeout_ms: 300000

scada:
  host_application:
    enabled: true
    primary_host:
      enabled: true
      host_id: SCADA_HOST_01
      is_primary: true
    state_management:
      enabled: true
      topic_format: "spBv1.0/STATE/{host_id}"
      message_format: "ONLINE|OFFLINE"
      qos: 1
      retain: true
      publish_interval_ms: 30000
      publish_on_connect: true
      publish_on_disconnect: true
    birth_monitoring:
      subscribe_to_births: true
      auto_discovery: true
    command_interface:
      enabled: true
      authorized_groups: ["*"]
      rate_limiting:
        max_commands_per_minute: 100
    data_subscription:
      auto_subscribe: true
      rbe_detection:
        enabled: true
        track_changes: true
    store_and_forward:
      enabled: false
      storage_backend: redis
      max_queue_size: 10000
      flush_on_reconnect: true

telemetry:
  opentelemetry:
    enabled: false
    service_name: sparkplug-broker
    metrics:
      enabled: false
      port: 9090
      path: /metrics
    traces:
      enabled: false
      sample_rate: 0.1
  logging:
    level: info
    pretty: true
    destination: stdout
    audit_log:
      enabled: true
      log_commands: true
      log_births: true
      log_deaths: true

storage:
  redis:
    host: localhost
    port: 6379
    db: 0
    password: null
  sqlite:
    enabled: false
    path: ./data/sparkplug.db
    wal_mode: true
`;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Loading and Validation', () => {
    it('should load valid YAML configuration', () => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);

      const loader = new ConfigLoader('./config/sparkplug.yaml');
      const config = loader.get();

      expect(config).toBeDefined();
      expect(config.sparkplug.version).toBe('spBv1.0');
    });

    it('should validate sparkplug version exists', () => {
      const invalidYaml = `
mqtt:
  ports:
    tcp: 1883
`;
      vi.mocked(readFileSync).mockReturnValue(invalidYaml);

      expect(() => new ConfigLoader('./config/sparkplug.yaml')).toThrow('sparkplug.version is required');
    });

    it('should validate sparkplug version format', () => {
      const invalidYaml = `
sparkplug:
  version: invalid
`;
      vi.mocked(readFileSync).mockReturnValue(invalidYaml);

      expect(() => new ConfigLoader('./config/sparkplug.yaml')).toThrow('Invalid sparkplug version format');
    });

    it('should accept spBv1.0 version', () => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);

      const loader = new ConfigLoader();
      expect(loader.sparkplugVersion).toBe('spBv1.0');
    });

    it('should accept spBv2.0 version', () => {
      const yaml = validYaml.replace('spBv1.0', 'spBv2.0');
      vi.mocked(readFileSync).mockReturnValue(yaml);

      const loader = new ConfigLoader();
      expect(loader.sparkplugVersion).toBe('spBv2.0');
    });

    it('should accept spv1.0 version (non-B)', () => {
      const yaml = validYaml.replace('spBv1.0', 'spv1.0');
      vi.mocked(readFileSync).mockReturnValue(yaml);

      const loader = new ConfigLoader();
      expect(loader.sparkplugVersion).toBe('spv1.0');
    });
  });

  describe('Getter Methods', () => {
    beforeEach(() => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);
    });

    it('should get sparkplug version', () => {
      const loader = new ConfigLoader();
      expect(loader.sparkplugVersion).toBe('spBv1.0');
    });

    it('should get namespace prefix', () => {
      const loader = new ConfigLoader();
      expect(loader.namespacePrefix).toBe('spBv1.0');
    });

    it('should check if aware broker is enabled', () => {
      const loader = new ConfigLoader();
      expect(loader.isAwareEnabled()).toBe(true);
    });

    it('should check if SCADA is enabled', () => {
      const loader = new ConfigLoader();
      expect(loader.isSCADAEnabled()).toBe(true);
    });

    it('should get Redis config', () => {
      const loader = new ConfigLoader();
      const redis = loader.getRedisConfig();

      expect(redis.host).toBe('localhost');
      expect(redis.port).toBe(6379);
      expect(redis.db).toBe(0);
    });

    it('should get MQTT config', () => {
      const loader = new ConfigLoader();
      const mqtt = loader.getMQTTConfig();

      expect(mqtt.ports.tcp).toBe(1883);
      expect(mqtt.ports.tcp_tls).toBe(8883);
      expect(mqtt.limits.max_clients).toBe(1000);
    });

    it('should return full config', () => {
      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.sparkplug).toBeDefined();
      expect(config.mqtt).toBeDefined();
      expect(config.aware_broker).toBeDefined();
      expect(config.scada).toBeDefined();
    });
  });

  describe('Topic Validation', () => {
    beforeEach(() => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);
    });

    it('should validate Sparkplug B topic', () => {
      const loader = new ConfigLoader();

      expect(loader.validateTopic('spBv1.0/Group1/NBIRTH/Node1')).toBe(true);
    });

    it('should validate certificate topic', () => {
      const loader = new ConfigLoader();

      expect(loader.validateTopic('$sparkplug/certificates/spBv1.0/Group1/NBIRTH/Node1')).toBe(true);
    });

    it('should reject non-Sparkplug topic', () => {
      const loader = new ConfigLoader();

      expect(loader.validateTopic('random/topic')).toBe(false);
    });

    it('should reject empty topic', () => {
      const loader = new ConfigLoader();

      expect(loader.validateTopic('')).toBe(false);
    });

    it('should validate STATE topic', () => {
      const loader = new ConfigLoader();

      expect(loader.validateTopic('spBv1.0/STATE/SCADA_HOST_01')).toBe(true);
    });
  });

  describe('Aware Broker Configuration', () => {
    it('should return false when aware broker is disabled', () => {
      const yaml = validYaml.replace('aware_broker:\n  enabled: true', 'aware_broker:\n  enabled: false');
      vi.mocked(readFileSync).mockReturnValue(yaml);

      const loader = new ConfigLoader();
      expect(loader.isAwareEnabled()).toBe(false);
    });

    it('should access birth certificate storage config', () => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);

      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.aware_broker.birth_certificate_storage.enabled).toBe(true);
      expect(config.aware_broker.birth_certificate_storage.storage_backend).toBe('redis');
    });

    it('should access sequence validation config', () => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);

      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.aware_broker.sequence_validation.enabled).toBe(true);
      expect(config.aware_broker.sequence_validation.enforce_bdseq_matching).toBe(true);
    });

    it('should access state management config', () => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);

      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.aware_broker.state_management.track_node_states).toBe(true);
      expect(config.aware_broker.state_management.heartbeat_monitoring).toBe(true);
    });
  });

  describe('SCADA Configuration', () => {
    beforeEach(() => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);
    });

    it('should access primary host config', () => {
      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.scada.host_application.primary_host.enabled).toBe(true);
      expect(config.scada.host_application.primary_host.host_id).toBe('SCADA_HOST_01');
      expect(config.scada.host_application.primary_host.is_primary).toBe(true);
    });

    it('should access state management config', () => {
      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.scada.host_application.state_management.enabled).toBe(true);
      expect(config.scada.host_application.state_management.qos).toBe(1);
      expect(config.scada.host_application.state_management.retain).toBe(true);
    });

    it('should access command interface config', () => {
      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.scada.host_application.command_interface.enabled).toBe(true);
      expect(config.scada.host_application.command_interface.authorized_groups).toContain('*');
    });
  });

  describe('Compliant Broker Configuration', () => {
    beforeEach(() => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);
    });

    it('should access session management config', () => {
      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.compliant_broker.session_management.clean_session_enforcement).toBe(true);
      expect(config.compliant_broker.session_management.session_expiry).toBe(0);
    });

    it('should access last will config', () => {
      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.compliant_broker.last_will.enabled).toBe(true);
      expect(config.compliant_broker.last_will.qos_enforcement).toBe(0);
      expect(config.compliant_broker.last_will.retain_enforcement).toBe(false);
    });

    it('should access QoS levels', () => {
      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.compliant_broker.mqtt.qos_levels).toEqual([0, 1, 2]);
    });
  });

  describe('Storage Configuration', () => {
    beforeEach(() => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);
    });

    it('should access Redis config', () => {
      const loader = new ConfigLoader();
      const redis = loader.getRedisConfig();

      expect(redis.host).toBe('localhost');
      expect(redis.port).toBe(6379);
      expect(redis.db).toBe(0);
      expect(redis.password).toBeNull();
    });

    it('should access SQLite config', () => {
      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.storage.sqlite.enabled).toBe(false);
      expect(config.storage.sqlite.path).toBe('./data/sparkplug.db');
      expect(config.storage.sqlite.wal_mode).toBe(true);
    });
  });

  describe('Telemetry Configuration', () => {
    beforeEach(() => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);
    });

    it('should access logging config', () => {
      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.telemetry.logging.level).toBe('info');
      expect(config.telemetry.logging.pretty).toBe(true);
      expect(config.telemetry.logging.destination).toBe('stdout');
    });

    it('should access audit log config', () => {
      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.telemetry.logging.audit_log.enabled).toBe(true);
      expect(config.telemetry.logging.audit_log.log_births).toBe(true);
    });

    it('should access OpenTelemetry config', () => {
      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.telemetry.opentelemetry.enabled).toBe(false);
      expect(config.telemetry.opentelemetry.service_name).toBe('sparkplug-broker');
    });
  });

  describe('Edge Cases', () => {
    it('should use default config path', () => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);

      const loader = new ConfigLoader(); // No path specified
      expect(readFileSync).toHaveBeenCalledWith('./config/sparkplug.yaml', 'utf8');
    });

    it('should handle custom config path', () => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);

      const loader = new ConfigLoader('/custom/path/config.yaml');
      expect(readFileSync).toHaveBeenCalledWith('/custom/path/config.yaml', 'utf8');
    });

    it('should reject version without dot separator', () => {
      const invalidYaml = `
sparkplug:
  version: spBv10
`;
      vi.mocked(readFileSync).mockReturnValue(invalidYaml);

      expect(() => new ConfigLoader()).toThrow('Invalid sparkplug version format');
    });

    it('should reject version with wrong prefix', () => {
      const invalidYaml = `
sparkplug:
  version: mqtt1.0
`;
      vi.mocked(readFileSync).mockReturnValue(invalidYaml);

      expect(() => new ConfigLoader()).toThrow('Invalid sparkplug version format');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should load production-like configuration', () => {
      vi.mocked(readFileSync).mockReturnValue(validYaml);

      const loader = new ConfigLoader();
      const config = loader.get();

      // Verify Sparkplug compliance requirements
      expect(config.compliant_broker.session_management.clean_session_enforcement).toBe(true);
      expect(config.compliant_broker.session_management.session_expiry).toBe(0);
      expect(config.compliant_broker.last_will.qos_enforcement).toBe(0);

      // Verify aware broker features
      expect(config.aware_broker.enabled).toBe(true);
      expect(config.aware_broker.sequence_validation.enabled).toBe(true);

      // Verify SCADA host configuration
      expect(config.scada.host_application.enabled).toBe(true);
      expect(config.scada.host_application.state_management.qos).toBe(1);
      expect(config.scada.host_application.state_management.retain).toBe(true);
    });

    it('should support development configuration', () => {
      const devYaml = validYaml.replace('level: info', 'level: debug');
      vi.mocked(readFileSync).mockReturnValue(devYaml);

      const loader = new ConfigLoader();
      const config = loader.get();

      expect(config.telemetry.logging.level).toBe('debug');
      expect(config.telemetry.logging.pretty).toBe(true);
    });
  });
});
