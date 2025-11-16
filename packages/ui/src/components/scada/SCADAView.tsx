/**
 * SCADA View Component
 * Real-time monitoring of Edge of Network nodes and devices
 * Uses SCADA MQTT Service (Sparkplug B Host Application)
 */

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { useSCADAStore } from '../../stores/scadaStore';
import { useBrokerStore } from '../../stores/brokerStore';
import { scadaMqttService } from '../../services/scadaMqttService';
import { GridView } from './GridView';
import { TreeView } from './TreeView';
import { DetailPanel } from './DetailPanel';
import { FilterPanel } from './FilterPanel';
import { StateIndicator } from './StateIndicator';
import { AlarmPanel } from './AlarmPanel';
import { processSparkplugMessage, calculateMessagesPerSecond } from '../../services/sparkplugProcessor';
import { useAlarmMonitoring } from '../../hooks/useAlarmMonitoring';

export function SCADAView() {
  const { nodes, devices, viewMode, setViewMode, removeNode, removeDevice, batchUpdate } = useSCADAStore();
  const { logs } = useBrokerStore();

  // SCADA connection status
  const isConnected = scadaMqttService.isClientConnected();

  // Enable alarm monitoring
  useAlarmMonitoring();

  // Track last processed message index to prevent message loss
  const lastProcessedIndex = useRef(0);
  // Batch update buffer for performance optimization
  const batchUpdateBuffer = useRef<Array<any>>([]);
  const batchUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  // Flush batch updates to store
  const flushBatchUpdates = useCallback(() => {
    if (batchUpdateBuffer.current.length > 0) {
      batchUpdate(batchUpdateBuffer.current);
      batchUpdateBuffer.current = [];
    }
  }, [batchUpdate]);

  // Process incoming MQTT messages from SCADA service and update SCADA store
  useEffect(() => {
    const unsubscribe = useBrokerStore.subscribe((state) => {
      // Process only new messages since last update
      const newLogs = state.logs.slice(lastProcessedIndex.current);

      newLogs.forEach((log, index) => {
        const result = processSparkplugMessage(log);
        if (!result) return;

        if (result.type === 'node' && result.node && result.nodeKey) {
          if (result.action === 'birth') {
            batchUpdateBuffer.current.push({ type: 'addNode', node: result.node });
          } else {
            batchUpdateBuffer.current.push({ type: 'updateNode', nodeKey: result.nodeKey, node: result.node });
          }
        } else if (result.type === 'device' && result.device && result.nodeKey) {
          const node = nodes.get(result.nodeKey);
          if (!node) return;

          if (result.action === 'birth') {
            // Add device to node's devices array
            const existingDevice = node.devices.find(d => d.deviceId === result.device!.deviceId);
            if (!existingDevice) {
              batchUpdateBuffer.current.push({
                type: 'updateNode',
                nodeKey: result.nodeKey,
                node: { devices: [...node.devices, result.device as any] },
              });
            }
            batchUpdateBuffer.current.push({ type: 'addDevice', device: result.device });
          } else if (result.action === 'death') {
            // Update device online status
            const deviceIndex = node.devices.findIndex(d => d.deviceId === result.device!.deviceId);
            if (deviceIndex >= 0) {
              const updatedDevices = [...node.devices];
              updatedDevices[deviceIndex] = { ...updatedDevices[deviceIndex], ...result.device };
              batchUpdateBuffer.current.push({
                type: 'updateNode',
                nodeKey: result.nodeKey,
                node: { devices: updatedDevices },
              });
            }
            if (result.device.deviceId) {
              batchUpdateBuffer.current.push({
                type: 'updateDevice',
                deviceId: result.device.deviceId,
                device: result.device,
              });
            }
          } else if (result.action === 'data') {
            // Update device metrics
            const deviceIndex = node.devices.findIndex(d => d.deviceId === result.device!.deviceId);
            if (deviceIndex >= 0) {
              const updatedDevices = [...node.devices];
              const existingDevice = updatedDevices[deviceIndex];
              const mergedMetrics = new Map([...existingDevice.metrics, ...result.device.metrics!]);
              updatedDevices[deviceIndex] = { ...existingDevice, ...result.device, metrics: mergedMetrics };
              batchUpdateBuffer.current.push({
                type: 'updateNode',
                nodeKey: result.nodeKey,
                node: { devices: updatedDevices },
              });
            }
            if (result.device.deviceId) {
              const existingDevice = devices.get(result.device.deviceId);
              if (existingDevice) {
                const mergedMetrics = new Map([...existingDevice.metrics, ...result.device.metrics!]);
                batchUpdateBuffer.current.push({
                  type: 'updateDevice',
                  deviceId: result.device.deviceId,
                  device: { ...result.device, metrics: mergedMetrics },
                });
              }
            }
          }
        }

        // Update last processed index
        lastProcessedIndex.current = lastProcessedIndex.current + index + 1;
      });

      // Schedule batch update flush (100ms debounce or immediate if buffer is large)
      if (batchUpdateBuffer.current.length > 0) {
        if (batchUpdateTimer.current) {
          clearTimeout(batchUpdateTimer.current);
        }

        // Flush immediately if buffer is large (>50 updates) to avoid memory issues
        if (batchUpdateBuffer.current.length > 50) {
          flushBatchUpdates();
        } else {
          // Otherwise debounce to 100ms
          batchUpdateTimer.current = setTimeout(flushBatchUpdates, 100);
        }
      }
    });

    return () => {
      unsubscribe();
      if (batchUpdateTimer.current) {
        clearTimeout(batchUpdateTimer.current);
      }
      // Flush any remaining updates on unmount
      flushBatchUpdates();
    };
  }, [nodes, devices, batchUpdate, flushBatchUpdates]);

  // Periodic cleanup of stale offline nodes/devices (memory leak prevention)
  useEffect(() => {
    const TTL_MS = 3600000; // 1 hour

    const cleanupInterval = setInterval(() => {
      const now = BigInt(Date.now());

      // Clean up offline nodes that haven't been seen in > TTL
      Array.from(nodes.entries()).forEach(([nodeKey, node]) => {
        if (!node.online && node.lastUpdate) {
          const age = Number(now - node.lastUpdate);
          if (age > TTL_MS) {
            console.log(`Removing stale node: ${nodeKey} (offline for ${Math.round(age / 1000)}s)`);
            removeNode(nodeKey);
          }
        }
      });

      // Clean up offline devices that haven't been seen in > TTL
      Array.from(devices.entries()).forEach(([deviceId, device]) => {
        if (!device.online && device.lastUpdate) {
          const age = Number(now - device.lastUpdate);
          if (age > TTL_MS) {
            console.log(`Removing stale device: ${deviceId} (offline for ${Math.round(age / 1000)}s)`);
            removeDevice(deviceId);
          }
        }
      });
    }, 300000); // Check every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [nodes, devices, removeNode, removeDevice]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalNodes = nodes.size;
    const onlineNodes = Array.from(nodes.values()).filter((n) => n.online).length;
    const totalDevices = Array.from(nodes.values()).reduce(
      (sum, node) => sum + node.devices.length,
      0
    );
    const onlineDevices = Array.from(nodes.values()).reduce(
      (sum, node) => sum + node.devices.filter((d) => d.online).length,
      0
    );
    const messagesPerSec = calculateMessagesPerSecond(messages);

    return { totalNodes, onlineNodes, totalDevices, onlineDevices, messagesPerSec };
  }, [nodes, messages]);

  return (
    <div className="h-full bg-slate-950 p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">SCADA Monitor</h2>
              <p className="text-slate-400">
                Real-time monitoring of Edge of Network nodes and devices
              </p>
            </div>
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-slate-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-xs text-slate-400 mb-1">Total Nodes</p>
            <p className="text-2xl font-bold text-white">{stats.totalNodes}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-xs text-slate-400 mb-1">Online Nodes</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.onlineNodes}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-xs text-slate-400 mb-1">Total Devices</p>
            <p className="text-2xl font-bold text-white">{stats.totalDevices}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-xs text-slate-400 mb-1">Online Devices</p>
            <p className="text-2xl font-bold text-cyan-500">{stats.onlineDevices}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-xs text-slate-400 mb-1">Messages/sec</p>
            <p className="text-2xl font-bold text-white">{stats.messagesPerSec}</p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="mb-6 flex gap-2">
          {(['grid', 'tree', 'detail', 'alarms'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {mode === 'grid' && '⊞ Grid View'}
              {mode === 'tree' && '⊟ Tree View'}
              {mode === 'detail' && '⊡ Detail View'}
              {mode === 'alarms' && '🚨 Alarms'}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel (Left Sidebar) */}
          <div className="lg:col-span-1 space-y-6">
            <FilterPanel />
            <StateIndicator />
          </div>

          {/* Content Area (Main) */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              {viewMode === 'grid' && <GridView />}
              {viewMode === 'tree' && <TreeView />}
              {viewMode === 'detail' && <DetailPanel />}
              {viewMode === 'alarms' && <AlarmPanel />}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
