/**
 * Broker Store
 * Manages broker logs, sessions, subscriptions, and statistics
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  BrokerLog,
  Session,
  Subscription,
  ACLRule,
  Namespace,
  BrokerStats,
  LogFilter,
  VisualizationMode,
} from '../types/broker.types';

interface BrokerState {
  // Data
  logs: BrokerLog[];
  sessions: Map<string, Session>;
  subscriptions: Subscription[];
  acls: ACLRule[];
  namespaces: Map<string, Namespace>;
  stats: BrokerStats;

  // UI State
  visualizationMode: VisualizationMode;
  filter: LogFilter;
  maxLogs: number;

  // Actions
  addLog: (log: BrokerLog) => void;
  clearLogs: () => void;

  addSession: (session: Session) => void;
  updateSession: (clientId: string, data: Partial<Session>) => void;
  removeSession: (clientId: string) => void;

  addSubscription: (subscription: Subscription) => void;
  removeSubscription: (clientId: string, topic: string) => void;

  addACL: (acl: ACLRule) => void;
  removeACL: (clientId: string, topic: string) => void;

  updateNamespace: (groupId: string, namespace: Namespace) => void;
  removeNamespace: (groupId: string) => void;

  updateStats: (stats: Partial<BrokerStats>) => void;

  setVisualizationMode: (mode: VisualizationMode) => void;
  setFilter: (filter: Partial<LogFilter>) => void;
  setMaxLogs: (max: number) => void;
}

export const useBrokerStore = create<BrokerState>()(
  immer((set) => ({
    // Initial State
    logs: [],
    sessions: new Map(),
    subscriptions: [],
    acls: [],
    namespaces: new Map(),
    stats: {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      messagesPerSecond: 0,
      bytesReceived: 0,
      bytesSent: 0,
      uptime: 0,
    },
    visualizationMode: 'tree',
    filter: {},
    maxLogs: 1000,

    // Log Actions
    addLog: (log) =>
      set((state) => {
        state.logs.push(log);
        // Keep only last maxLogs entries
        if (state.logs.length > state.maxLogs) {
          state.logs.shift();
        }
      }),

    clearLogs: () =>
      set((state) => {
        state.logs = [];
      }),

    // Session Actions
    addSession: (session) =>
      set((state) => {
        state.sessions.set(session.clientId, session);
        state.stats.activeConnections = state.sessions.size;
      }),

    updateSession: (clientId, data) =>
      set((state) => {
        const session = state.sessions.get(clientId);
        if (session) {
          state.sessions.set(clientId, { ...session, ...data });
        }
      }),

    removeSession: (clientId) =>
      set((state) => {
        state.sessions.delete(clientId);
        state.stats.activeConnections = state.sessions.size;
      }),

    // Subscription Actions
    addSubscription: (subscription) =>
      set((state) => {
        state.subscriptions.push(subscription);
      }),

    removeSubscription: (clientId, topic) =>
      set((state) => {
        state.subscriptions = state.subscriptions.filter(
          (sub) => !(sub.clientId === clientId && sub.topic === topic)
        );
      }),

    // ACL Actions
    addACL: (acl) =>
      set((state) => {
        state.acls.push(acl);
      }),

    removeACL: (clientId, topic) =>
      set((state) => {
        state.acls = state.acls.filter(
          (acl) => !(acl.clientId === clientId && acl.topic === topic)
        );
      }),

    // Namespace Actions
    updateNamespace: (groupId, namespace) =>
      set((state) => {
        state.namespaces.set(groupId, namespace);
      }),

    removeNamespace: (groupId) =>
      set((state) => {
        state.namespaces.delete(groupId);
      }),

    // Stats Actions
    updateStats: (stats) =>
      set((state) => {
        state.stats = { ...state.stats, ...stats };
      }),

    // UI Actions
    setVisualizationMode: (mode) =>
      set((state) => {
        state.visualizationMode = mode;
      }),

    setFilter: (filter) =>
      set((state) => {
        state.filter = { ...state.filter, ...filter };
      }),

    setMaxLogs: (max) =>
      set((state) => {
        state.maxLogs = max;
      }),
  }))
);
