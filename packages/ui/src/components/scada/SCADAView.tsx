/**
 * SCADA View Component
 * Real-time monitoring of Edge of Network nodes and devices
 */

import { useEffect, useMemo } from 'react';
import { useSCADAStore } from '../../stores/scadaStore';
import { useMQTTStore } from '../../stores/mqttStore';
import { GridView } from './GridView';
import { TreeView } from './TreeView';
import { DetailPanel } from './DetailPanel';
import { FilterPanel } from './FilterPanel';
import { processSparkplugMessage, calculateMessagesPerSecond } from '../../services/sparkplugProcessor';

export function SCADAView() {
  const { nodes, devices, viewMode, setViewMode, addNode, updateNode, addDevice, updateDevice } = useSCADAStore();
  const { isConnected, messages } = useMQTTStore();

  // Process incoming MQTT messages and update SCADA store
  useEffect(() => {
    const unsubscribe = useMQTTStore.subscribe((state) => {
      const latestMessages = state.messages.slice(-10); // Process last 10 messages

      latestMessages.forEach((msg) => {
        const log = {
          id: `${msg.timestamp}`,
          timestamp: msg.timestamp,
          type: 'publish' as const,
          clientId: 'broker',
          topic: msg.topic,
          qos: 0 as const,
          payload: new Uint8Array(msg.payload),
          origin: { ip: 'unknown', port: 0 },
        };

        const result = processSparkplugMessage(log);
        if (!result) return;

        if (result.type === 'node' && result.node && result.nodeKey) {
          if (result.action === 'birth') {
            addNode(result.node as any);
          } else {
            updateNode(result.nodeKey, result.node);
          }
        } else if (result.type === 'device' && result.device && result.nodeKey) {
          const node = nodes.get(result.nodeKey);
          if (!node) return;

          if (result.action === 'birth') {
            // Add device to node's devices array
            const existingDevice = node.devices.find(d => d.deviceId === result.device!.deviceId);
            if (!existingDevice) {
              updateNode(result.nodeKey, {
                devices: [...node.devices, result.device as any],
              });
            }
            addDevice(result.device as any);
          } else if (result.action === 'death') {
            // Update device online status
            const deviceIndex = node.devices.findIndex(d => d.deviceId === result.device!.deviceId);
            if (deviceIndex >= 0) {
              const updatedDevices = [...node.devices];
              updatedDevices[deviceIndex] = { ...updatedDevices[deviceIndex], ...result.device };
              updateNode(result.nodeKey, { devices: updatedDevices });
            }
            if (result.device.deviceId) {
              updateDevice(result.device.deviceId, result.device);
            }
          } else if (result.action === 'data') {
            // Update device metrics
            const deviceIndex = node.devices.findIndex(d => d.deviceId === result.device!.deviceId);
            if (deviceIndex >= 0) {
              const updatedDevices = [...node.devices];
              const existingDevice = updatedDevices[deviceIndex];
              const mergedMetrics = new Map([...existingDevice.metrics, ...result.device.metrics!]);
              updatedDevices[deviceIndex] = { ...existingDevice, ...result.device, metrics: mergedMetrics };
              updateNode(result.nodeKey, { devices: updatedDevices });
            }
            if (result.device.deviceId) {
              const existingDevice = devices.get(result.device.deviceId);
              if (existingDevice) {
                const mergedMetrics = new Map([...existingDevice.metrics, ...result.device.metrics!]);
                updateDevice(result.device.deviceId, { ...result.device, metrics: mergedMetrics });
              }
            }
          }
        }
      });
    });

    return unsubscribe;
  }, [nodes, devices, addNode, updateNode, addDevice, updateDevice]);

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
          {(['grid', 'tree', 'detail'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {mode === 'grid' && '⊞ Grid View'}
              {mode === 'tree' && '⊟ Tree View'}
              {mode === 'detail' && '⊡ Detail View'}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel (Left Sidebar) */}
          <div className="lg:col-span-1">
            <FilterPanel />
          </div>

          {/* Content Area (Main) */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              {viewMode === 'grid' && <GridView />}
              {viewMode === 'tree' && <TreeView />}
              {viewMode === 'detail' && <DetailPanel />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
