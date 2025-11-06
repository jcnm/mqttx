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
