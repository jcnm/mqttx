/**
 * SCADA Store
 * Manages EoN nodes, devices, and real-time metric updates
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { EoNNode, Device, ViewMode, SCADAFilter } from '../types/scada.types';

interface BatchUpdate {
  type: 'addNode' | 'updateNode' | 'addDevice' | 'updateDevice';
  nodeKey?: string;
  node?: EoNNode | Partial<EoNNode>;
  deviceId?: string;
  device?: Device | Partial<Device>;
}

interface SCADAState {
  // Data
  nodes: Map<string, EoNNode>;
  devices: Map<string, Device>;

  // UI State
  selectedNode: string | null;
  selectedDevice: string | null;
  viewMode: ViewMode;
  filter: SCADAFilter;

  // Actions
  addNode: (node: EoNNode) => void;
  updateNode: (nodeKey: string, data: Partial<EoNNode>) => void;
  removeNode: (nodeKey: string) => void;

  addDevice: (device: Device) => void;
  updateDevice: (deviceId: string, data: Partial<Device>) => void;
  removeDevice: (deviceId: string) => void;

  // Batch update for performance
  batchUpdate: (updates: BatchUpdate[]) => void;

  setSelectedNode: (nodeKey: string | null) => void;
  setSelectedDevice: (deviceId: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilter: (filter: Partial<SCADAFilter>) => void;

  clearAll: () => void;
}

export const useSCADAStore = create<SCADAState>()(
  immer((set) => ({
    // Initial State
    nodes: new Map(),
    devices: new Map(),
    selectedNode: null,
    selectedDevice: null,
    viewMode: 'grid',
    filter: {
      showOffline: true,
    },

    // Node Actions
    addNode: (node) =>
      set((state) => {
        const key = `${node.groupId}/${node.edgeNodeId}`;
        state.nodes.set(key, node);
      }),

    updateNode: (nodeKey, data) =>
      set((state) => {
        const node = state.nodes.get(nodeKey);
        if (node) {
          state.nodes.set(nodeKey, { ...node, ...data });
        }
      }),

    removeNode: (nodeKey) =>
      set((state) => {
        state.nodes.delete(nodeKey);
        if (state.selectedNode === nodeKey) {
          state.selectedNode = null;
        }
      }),

    // Device Actions
    addDevice: (device) =>
      set((state) => {
        state.devices.set(device.deviceId, device);
      }),

    updateDevice: (deviceId, data) =>
      set((state) => {
        const device = state.devices.get(deviceId);
        if (device) {
          state.devices.set(deviceId, { ...device, ...data });
        }
      }),

    removeDevice: (deviceId) =>
      set((state) => {
        state.devices.delete(deviceId);
        if (state.selectedDevice === deviceId) {
          state.selectedDevice = null;
        }
      }),

    // Batch Update - Apply multiple updates in a single state mutation
    batchUpdate: (updates) =>
      set((state) => {
        for (const update of updates) {
          switch (update.type) {
            case 'addNode':
              if (update.node && 'groupId' in update.node && 'edgeNodeId' in update.node) {
                const key = `${update.node.groupId}/${update.node.edgeNodeId}`;
                state.nodes.set(key, update.node as EoNNode);
              }
              break;
            case 'updateNode':
              if (update.nodeKey && update.node) {
                const node = state.nodes.get(update.nodeKey);
                if (node) {
                  state.nodes.set(update.nodeKey, { ...node, ...update.node });
                }
              }
              break;
            case 'addDevice':
              if (update.device && 'deviceId' in update.device) {
                state.devices.set(update.device.deviceId, update.device as Device);
              }
              break;
            case 'updateDevice':
              if (update.deviceId && update.device) {
                const device = state.devices.get(update.deviceId);
                if (device) {
                  state.devices.set(update.deviceId, { ...device, ...update.device });
                }
              }
              break;
          }
        }
      }),

    // UI Actions
    setSelectedNode: (nodeKey) =>
      set((state) => {
        state.selectedNode = nodeKey;
      }),

    setSelectedDevice: (deviceId) =>
      set((state) => {
        state.selectedDevice = deviceId;
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode;
      }),

    setFilter: (filter) =>
      set((state) => {
        state.filter = { ...state.filter, ...filter };
      }),

    clearAll: () =>
      set((state) => {
        state.nodes.clear();
        state.devices.clear();
        state.selectedNode = null;
        state.selectedDevice = null;
      }),
  }))
);
