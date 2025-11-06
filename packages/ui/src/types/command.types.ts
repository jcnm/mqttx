/**
 * Command Panel Type Definitions
 * For device control and command scheduling
 */

export type CommandType = 'NCMD' | 'DCMD' | 'REBIRTH' | 'CUSTOM';
export type ScheduleType = 'immediate' | 'at' | 'recurring' | 'conditional';
export type CommandStatus = 'pending' | 'sent' | 'acknowledged' | 'failed' | 'cancelled';

export interface CommandTarget {
  groupId: string;
  edgeNodeId: string;
  deviceId?: string;
}

export interface CommandMetric {
  name: string;
  alias?: bigint;
  value: number | string | boolean | bigint;
  datatype: number; // Sparkplug datatype
  timestamp?: bigint;
}

export interface MQTTOptions {
  qos: 0 | 1 | 2;
  retain: boolean;
  properties?: Record<string, any>;
}

export interface CommandSchedule {
  type: ScheduleType;
  timestamp?: number; // for 'at' type
  cron?: string; // for 'recurring' type
  condition?: string; // for 'conditional' type - e.g., "metric.temperature > 100"
  enabled?: boolean;
}

export interface Command {
  id: string;
  target: CommandTarget;
  type: CommandType;
  metrics: CommandMetric[];
  mqtt: MQTTOptions;
  schedule: CommandSchedule;
  status: CommandStatus;
  createdAt: number;
  sentAt?: number;
  acknowledgedAt?: number;
  error?: string;
  response?: {
    topic: string;
    payload: Uint8Array;
    timestamp: number;
  };
}

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  type: CommandType;
  metrics: CommandMetric[];
  defaultMQTT?: Partial<MQTTOptions>;
}

export interface CommandHistory {
  commands: Command[];
  totalSent: number;
  totalAcknowledged: number;
  totalFailed: number;
  lastExecuted?: number;
}

export interface ConditionalRule {
  id: string;
  name: string;
  condition: string; // JavaScript expression
  command: Omit<Command, 'id' | 'status' | 'createdAt'>;
  enabled: boolean;
  triggerCount: number;
  lastTriggered?: number;
}
