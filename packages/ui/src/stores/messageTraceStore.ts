/**
 * Message Trace Store
 * Stores detailed message traces from simulation engine
 * for pre-encoding, post-encoding, and transmission inspection
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { MessageTrace } from '../types/message-trace.types';

interface MessageTraceState {
  traces: MessageTrace[];
  maxTraces: number;

  addTrace: (trace: MessageTrace) => void;
  clearTraces: () => void;
  getTracesForNode: (edgeNodeId: string) => MessageTrace[];
  getTracesForDevice: (edgeNodeId: string, deviceId: string) => MessageTrace[];
}

export const useMessageTraceStore = create<MessageTraceState>()(
  immer((set, get) => ({
    traces: [],
    maxTraces: 500, // Keep last 500 traces

    addTrace: (trace) =>
      set((state) => {
        state.traces.push(trace);
        // Keep only the last maxTraces
        if (state.traces.length > state.maxTraces) {
          state.traces.shift();
        }
      }),

    clearTraces: () =>
      set((state) => {
        state.traces = [];
      }),

    getTracesForNode: (edgeNodeId: string) => {
      return get().traces.filter((trace) => trace.edgeNodeId === edgeNodeId && !trace.deviceId);
    },

    getTracesForDevice: (edgeNodeId: string, deviceId: string) => {
      return get().traces.filter((trace) => trace.edgeNodeId === edgeNodeId && trace.deviceId === deviceId);
    },
  }))
);
