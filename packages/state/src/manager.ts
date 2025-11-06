// Sparkplug State Manager
// Manages bdSeq, seq, and session state

import type { NodeState, DeviceState, SessionState, MetricState } from './types.js';

export class StateManager {
  private nodes: Map<string, NodeState> = new Map();
  private devices: Map<string, DeviceState> = new Map();
  private sessions: Map<string, SessionState> = new Map();

  // Node State Management
  private getNodeKey(groupId: string, edgeNodeId: string): string {
    return `${groupId}/${edgeNodeId}`;
  }

  createOrUpdateNode(
    groupId: string,
    edgeNodeId: string,
    bdSeq: bigint,
    online = true
  ): NodeState {
    const key = this.getNodeKey(groupId, edgeNodeId);
    const existing = this.nodes.get(key);

    const state: NodeState = {
      groupId,
      edgeNodeId,
      bdSeq,
      seq: existing?.seq ?? 0n,
      online,
      lastSeen: Date.now(),
      birthTimestamp: online ? BigInt(Date.now()) : existing?.birthTimestamp,
      metrics: existing?.metrics ?? new Map(),
    };

    this.nodes.set(key, state);
    return state;
  }

  getNode(groupId: string, edgeNodeId: string): NodeState | null {
    return this.nodes.get(this.getNodeKey(groupId, edgeNodeId)) ?? null;
  }

  setNodeOnline(groupId: string, edgeNodeId: string, bdSeq: bigint): void {
    const key = this.getNodeKey(groupId, edgeNodeId);
    const state = this.nodes.get(key);

    if (state) {
      state.online = true;
      state.bdSeq = bdSeq;
      state.seq = 0n; // Reset sequence on rebirth
      state.lastSeen = Date.now();
      state.birthTimestamp = BigInt(Date.now());
    } else {
      this.createOrUpdateNode(groupId, edgeNodeId, bdSeq, true);
    }
  }

  setNodeOffline(groupId: string, edgeNodeId: string): void {
    const key = this.getNodeKey(groupId, edgeNodeId);
    const state = this.nodes.get(key);

    if (state) {
      state.online = false;
      state.lastSeen = Date.now();
    }
  }

  updateNodeSeq(groupId: string, edgeNodeId: string, seq: bigint): boolean {
    const key = this.getNodeKey(groupId, edgeNodeId);
    const state = this.nodes.get(key);

    if (!state) {
      return false;
    }

    // Validate sequence number (must increment 0-255)
    const expectedSeq = (state.seq + 1n) % 256n;
    if (seq !== expectedSeq) {
      console.warn(
        `Sequence mismatch for ${key}: expected ${expectedSeq}, got ${seq}`
      );
      return false;
    }

    state.seq = seq;
    state.lastSeen = Date.now();
    return true;
  }

  validateBdSeq(groupId: string, edgeNodeId: string, bdSeq: bigint): boolean {
    const state = this.getNode(groupId, edgeNodeId);
    if (!state) {
      return true; // No state yet, accept any bdSeq
    }
    return state.bdSeq === bdSeq;
  }

  getAllNodes(): NodeState[] {
    return Array.from(this.nodes.values());
  }

  getOnlineNodes(): NodeState[] {
    return this.getAllNodes().filter((node) => node.online);
  }

  // Device State Management
  private getDeviceKey(groupId: string, edgeNodeId: string, deviceId: string): string {
    return `${groupId}/${edgeNodeId}/${deviceId}`;
  }

  createOrUpdateDevice(
    groupId: string,
    edgeNodeId: string,
    deviceId: string,
    online = true
  ): DeviceState {
    const key = this.getDeviceKey(groupId, edgeNodeId, deviceId);
    const existing = this.devices.get(key);

    const state: DeviceState = {
      groupId,
      edgeNodeId,
      deviceId,
      online,
      lastSeen: Date.now(),
      birthTimestamp: online ? BigInt(Date.now()) : existing?.birthTimestamp,
      metrics: existing?.metrics ?? new Map(),
    };

    this.devices.set(key, state);
    return state;
  }

  getDevice(groupId: string, edgeNodeId: string, deviceId: string): DeviceState | null {
    return this.devices.get(this.getDeviceKey(groupId, edgeNodeId, deviceId)) ?? null;
  }

  setDeviceOnline(groupId: string, edgeNodeId: string, deviceId: string): void {
    const key = this.getDeviceKey(groupId, edgeNodeId, deviceId);
    const state = this.devices.get(key);

    if (state) {
      state.online = true;
      state.lastSeen = Date.now();
      state.birthTimestamp = BigInt(Date.now());
    } else {
      this.createOrUpdateDevice(groupId, edgeNodeId, deviceId, true);
    }
  }

  setDeviceOffline(groupId: string, edgeNodeId: string, deviceId: string): void {
    const key = this.getDeviceKey(groupId, edgeNodeId, deviceId);
    const state = this.devices.get(key);

    if (state) {
      state.online = false;
      state.lastSeen = Date.now();
    }
  }

  getAllDevices(): DeviceState[] {
    return Array.from(this.devices.values());
  }

  getOnlineDevices(): DeviceState[] {
    return this.getAllDevices().filter((device) => device.online);
  }

  getDevicesForNode(groupId: string, edgeNodeId: string): DeviceState[] {
    const prefix = `${groupId}/${edgeNodeId}/`;
    return this.getAllDevices().filter(
      (device) =>
        device.groupId === groupId && device.edgeNodeId === edgeNodeId
    );
  }

  // Session Management
  createSession(clientId: string, cleanSession: boolean, bdSeq?: bigint): SessionState {
    const state: SessionState = {
      clientId,
      connected: true,
      connectTime: Date.now(),
      cleanSession,
      bdSeq,
    };

    this.sessions.set(clientId, state);
    return state;
  }

  getSession(clientId: string): SessionState | null {
    return this.sessions.get(clientId) ?? null;
  }

  disconnectSession(clientId: string): void {
    const session = this.sessions.get(clientId);
    if (session) {
      session.connected = false;
      session.disconnectTime = Date.now();
    }
  }

  removeSession(clientId: string): void {
    this.sessions.delete(clientId);
  }

  // Metric Management
  updateNodeMetric(
    groupId: string,
    edgeNodeId: string,
    metric: MetricState
  ): void {
    const key = this.getNodeKey(groupId, edgeNodeId);
    const state = this.nodes.get(key);

    if (state && state.metrics) {
      state.metrics.set(metric.name, metric);
      state.lastSeen = Date.now();
    }
  }

  updateDeviceMetric(
    groupId: string,
    edgeNodeId: string,
    deviceId: string,
    metric: MetricState
  ): void {
    const key = this.getDeviceKey(groupId, edgeNodeId, deviceId);
    const state = this.devices.get(key);

    if (state && state.metrics) {
      state.metrics.set(metric.name, metric);
      state.lastSeen = Date.now();
    }
  }

  // Statistics
  getStatistics() {
    return {
      totalNodes: this.nodes.size,
      onlineNodes: this.getOnlineNodes().length,
      totalDevices: this.devices.size,
      onlineDevices: this.getOnlineDevices().length,
      activeSessions: Array.from(this.sessions.values()).filter((s) => s.connected)
        .length,
    };
  }

  // Cleanup
  clear(): void {
    this.nodes.clear();
    this.devices.clear();
    this.sessions.clear();
  }
}
