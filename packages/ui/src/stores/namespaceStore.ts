import { create } from 'zustand';

interface Node {
  groupId: string;
  edgeNodeId: string;
  online: boolean;
  bdSeq: string;
  lastSeen: number;
}

interface Device {
  groupId: string;
  edgeNodeId: string;
  deviceId: string;
  online: boolean;
  lastSeen: number;
}

interface NamespaceState {
  nodes: Node[];
  devices: Device[];
  addNode: (node: Node) => void;
  addDevice: (device: Device) => void;
  updateNode: (groupId: string, edgeNodeId: string, updates: Partial<Node>) => void;
  updateDevice: (groupId: string, edgeNodeId: string, deviceId: string, updates: Partial<Device>) => void;
}

export const useNamespaceStore = create<NamespaceState>((set) => ({
  nodes: [],
  devices: [],

  addNode: (node) => set((state) => {
    const existing = state.nodes.find(
      (n) => n.groupId === node.groupId && n.edgeNodeId === node.edgeNodeId
    );

    if (existing) {
      return {
        nodes: state.nodes.map((n) =>
          n.groupId === node.groupId && n.edgeNodeId === node.edgeNodeId
            ? { ...n, ...node }
            : n
        ),
      };
    }

    return { nodes: [...state.nodes, node] };
  }),

  addDevice: (device) => set((state) => {
    const existing = state.devices.find(
      (d) =>
        d.groupId === device.groupId &&
        d.edgeNodeId === device.edgeNodeId &&
        d.deviceId === device.deviceId
    );

    if (existing) {
      return {
        devices: state.devices.map((d) =>
          d.groupId === device.groupId &&
          d.edgeNodeId === device.edgeNodeId &&
          d.deviceId === device.deviceId
            ? { ...d, ...device }
            : d
        ),
      };
    }

    return { devices: [...state.devices, device] };
  }),

  updateNode: (groupId, edgeNodeId, updates) => set((state) => ({
    nodes: state.nodes.map((n) =>
      n.groupId === groupId && n.edgeNodeId === edgeNodeId
        ? { ...n, ...updates }
        : n
    ),
  })),

  updateDevice: (groupId, edgeNodeId, deviceId, updates) => set((state) => ({
    devices: state.devices.map((d) =>
      d.groupId === groupId &&
      d.edgeNodeId === edgeNodeId &&
      d.deviceId === deviceId
        ? { ...d, ...updates }
        : d
    ),
  })),
}));
