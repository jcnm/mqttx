/**
 * Broker Viewer Type Definitions
 * For monitoring broker internals, configuration, and message flow
 */

import type { Payload } from '@sparkplug/codec';

export type MessageType =
  | 'NBIRTH'
  | 'NDEATH'
  | 'DBIRTH'
  | 'DDEATH'
  | 'NDATA'
  | 'DDATA'
  | 'NCMD'
  | 'DCMD'
  | 'STATE';

/**
 * MQTT Fixed Header - First byte of every MQTT packet
 */
export interface MQTTFixedHeader {
  messageType: number; // Bits 4-7
  messageTypeName: string; // CONNECT, PUBLISH, SUBSCRIBE, etc.
  dup: boolean; // Bit 3 - Duplicate delivery flag
  qos: 0 | 1 | 2; // Bits 1-2 - Quality of Service
  retain: boolean; // Bit 0 - Retain flag
  remainingLength: number; // Variable byte integer
}

/**
 * MQTT Variable Header - Depends on packet type
 */
export interface MQTTVariableHeader {
  // For PUBLISH packets
  topicName?: string;
  packetIdentifier?: number;

  // For MQTT 5.0 properties
  properties?: {
    payloadFormatIndicator?: number;
    messageExpiryInterval?: number;
    topicAlias?: number;
    responseTopic?: string;
    correlationData?: Uint8Array;
    userProperty?: Array<{ key: string; value: string }>;
    subscriptionIdentifier?: number;
    contentType?: string;
  };

  // For CONNECT packets
  protocolName?: string;
  protocolLevel?: number;
  connectFlags?: {
    cleanSession?: boolean;
    willFlag?: boolean;
    willQoS?: number;
    willRetain?: boolean;
    passwordFlag?: boolean;
    usernameFlag?: boolean;
  };
  keepAlive?: number;

  // For CONNACK packets
  sessionPresent?: boolean;
  returnCode?: number;
}

/**
 * Complete MQTT Packet Structure
 */
export interface MQTTPacketDetails {
  fixedHeader: MQTTFixedHeader;
  variableHeader: MQTTVariableHeader;
  payloadLength: number;
  totalPacketSize: number;
  raw: Uint8Array; // Complete raw packet bytes
}

export interface BrokerLog {
  id: string;
  timestamp: number;
  type: 'publish' | 'subscribe' | 'unsubscribe' | 'connect' | 'disconnect';
  clientId: string;
  topic?: string;
  qos?: 0 | 1 | 2;
  retain?: boolean;
  messageType?: MessageType;
  payload?: Uint8Array;
  decoded?: Payload;
  origin: {
    ip: string;
    port: number;
  };

  // Enhanced MQTT packet details
  mqttPacket?: MQTTPacketDetails;

  // Sparkplug B specific tracking
  sparkplugMetadata?: {
    groupId?: string;
    edgeNodeId?: string;
    deviceId?: string;
    bdSeq?: bigint;
    seq?: bigint;
    metricCount?: number;
    isStale?: boolean;
  };

  // Session tracking
  sessionInfo?: {
    isNewSession: boolean;
    sessionExpiry?: number;
    lastWillTopic?: string;
  };
}

export interface Session {
  clientId: string;
  ip: string;
  port: number;
  connectedAt: number;
  cleanSession: boolean;
  sessionExpiry: number;
  subscriptions: string[];
  stats: {
    bytesIn: number;
    bytesOut: number;
    messagesIn: number;
    messagesOut: number;
  };

  // Enhanced session tracking
  lastActivity: number;
  keepAlive: number;
  protocolVersion: number; // 3, 4, or 5 (MQTT 3.1, 3.1.1, or 5.0)
  isStale: boolean; // True if last activity > keepAlive * 1.5
  willMessage?: {
    topic: string;
    payload: Uint8Array;
    qos: 0 | 1 | 2;
    retain: boolean;
  };

  // Sparkplug B session tracking
  sparkplugState?: {
    groupId?: string;
    edgeNodeId?: string;
    bdSeq?: bigint;
    expectedSeq?: bigint;
    ndeathPublished?: boolean;
    birthTimestamp?: number;
  };
}

export interface Subscription {
  topic: string;
  qos: 0 | 1 | 2;
  clientId: string;
  subscribedAt: number;
}

export interface ACLRule {
  clientId: string;
  topic: string;
  access: 'allow' | 'deny';
  permission: 'read' | 'write' | 'readwrite';
}

export interface Namespace {
  groupId: string;
  edgeNodes: string[];
  deviceCount: number;
  lastActivity: number;
}

export interface BrokerStats {
  totalConnections: number;
  activeConnections: number;
  totalMessages: number;
  messagesPerSecond: number;
  bytesReceived: number;
  bytesSent: number;
  uptime: number;
}

export interface LogFilter {
  clientId?: string;
  topic?: string;
  messageType?: MessageType;
  qos?: 0 | 1 | 2;
  timeRange?: {
    start: number;
    end: number;
  };
}

export type VisualizationMode = 'linear' | 'timeseries' | 'graph' | 'tree';
