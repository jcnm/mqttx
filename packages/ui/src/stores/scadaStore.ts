/**
 * SCADA Store
 * Manages EoN nodes, devices, and real-time metric updates
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { EoNNode, Device, ViewMode, SCADAFilter } from '../types/scada.types';

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
