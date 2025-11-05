/**
 * Target Selector Component
 * Select existing nodes from simulator or define new ones on-the-fly
 */

import { useState, useMemo, useEffect } from 'react';
import { useSimulatorStore } from '../../stores/simulatorStore';
import { useSCADAStore } from '../../stores/scadaStore';

export interface CommandTarget {
  mode: 'existing' | 'new';

  // For existing nodes
  nodeId?: string;
  deviceId?: string;

  // For new nodes (on-the-fly)
  namespace?: string;
  groupId?: string;
  edgeNodeId?: string;
  deviceIdNew?: string;

  // Protocol
  protocol: 'SparkplugB' | 'RawMQTTv5';

  // Sequence numbers (for Sparkplug B)
  bdSeq?: number;
  seq?: number;
}

interface TargetSelectorProps {
  target: CommandTarget | null;
  onChange: (target: CommandTarget) => void;
  allowDevice?: boolean; // Allow selecting devices vs just nodes
}

const getDefaultTarget = (): CommandTarget => ({
  mode: 'existing',
  protocol: 'SparkplugB',
  bdSeq: 0,
  seq: 0,
});

export function TargetSelector({ target, onChange, allowDevice = true }: TargetSelectorProps) {
  const { nodes: simNodes } = useSimulatorStore();
  const { nodes: scadaNodes } = useSCADAStore();

  // Initialize with defaults if target is null - only once on mount
  useEffect(() => {
    if (!target) {
      onChange(getDefaultTarget());
    }
  }, []);

  // Show loading state while target is being initialized
  if (!target) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-400">Loading target selection...</div>
      </div>
    );
  }

  const [showNewForm, setShowNewForm] = useState(target.mode === 'new');

  // Combine simulator and SCADA nodes
  const allNodes = useMemo(() => {
    const combined: Array<{
      id: string;
      groupId: string;
      edgeNodeId: string;
      source: 'simulator' | 'scada';
      devices: Array<{ id: string; deviceId: string }>;
    }> = [];

    // Add simulator nodes
    Array.from(simNodes.values()).forEach((node) => {
      combined.push({
        id: node.id,
        groupId: node.config.groupId,
        edgeNodeId: node.config.edgeNodeId,
        source: 'simulator',
        devices: node.devices.map((d) => ({ id: d.id, deviceId: d.deviceId })),
      });
    });

    // Add SCADA nodes
    Array.from(scadaNodes.values()).forEach((node) => {
      const nodeKey = `${node.groupId}/${node.edgeNodeId}`;
      if (!combined.find((n) => n.id === nodeKey)) {
        combined.push({
          id: nodeKey,
          groupId: node.groupId,
          edgeNodeId: node.edgeNodeId,
          source: 'scada',
          devices: [], // SCADA doesn't track devices separately in current impl
        });
      }
    });

    return combined;
  }, [simNodes, scadaNodes]);

  const selectedNode = useMemo(() => {
    return allNodes.find((n) => n.id === target.nodeId);
  }, [allNodes, target.nodeId]);

  const handleModeChange = (mode: 'existing' | 'new') => {
    setShowNewForm(mode === 'new');
    onChange({
      ...target,
      mode,
      nodeId: mode === 'existing' ? allNodes[0]?.id : undefined,
      groupId: mode === 'new' ? 'Group1' : undefined,
      edgeNodeId: mode === 'new' ? 'EdgeNode1' : undefined,
    });
  };

  const handleNodeSelect = (nodeId: string) => {
    const node = allNodes.find((n) => n.id === nodeId);
    onChange({
      ...target,
      nodeId,
      deviceId: undefined,
      groupId: node?.groupId,
      edgeNodeId: node?.edgeNodeId,
    });
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          Target Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleModeChange('existing')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showNewForm
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            📋 Existing Node
          </button>
          <button
            onClick={() => handleModeChange('new')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showNewForm
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            ✨ New Node
          </button>
        </div>
      </div>

      {/* Existing Node Selection */}
      {!showNewForm && (
        <div className="space-y-3">
          {allNodes.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm">
                No nodes available. Create nodes in the Simulator first or use "New Node" mode.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Select EoN Node
                </label>
                <select
                  value={target.nodeId || ''}
                  onChange={(e) => handleNodeSelect(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">-- Select Node --</option>
                  {allNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.groupId} / {node.edgeNodeId} ({node.source})
                    </option>
                  ))}
                </select>
              </div>

              {allowDevice && selectedNode && selectedNode.devices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Device (optional)
                  </label>
                  <select
                    value={target.deviceId || ''}
                    onChange={(e) => onChange({ ...target, deviceId: e.target.value || undefined })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">-- None (Node level) --</option>
                    {selectedNode.devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.deviceId}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedNode && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                  <div className="text-xs text-slate-400 space-y-1">
                    <div><span className="font-medium">Group ID:</span> {selectedNode.groupId}</div>
                    <div><span className="font-medium">Edge Node ID:</span> {selectedNode.edgeNodeId}</div>
                    <div><span className="font-medium">Source:</span> {selectedNode.source}</div>
                    {target.deviceId && (
                      <div><span className="font-medium">Device:</span> {target.deviceId}</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* New Node Form */}
      {showNewForm && (
        <div className="space-y-3">
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
            <p className="text-xs text-blue-400">
              Define a new node on-the-fly. This won't be added to your simulation but will be used to send commands.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Namespace
            </label>
            <input
              type="text"
              value={target.namespace || 'spBv1.0'}
              onChange={(e) => onChange({ ...target, namespace: e.target.value })}
              placeholder="spBv1.0"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Group ID *
            </label>
            <input
              type="text"
              value={target.groupId || ''}
              onChange={(e) => onChange({ ...target, groupId: e.target.value })}
              placeholder="Group1"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Edge Node ID *
            </label>
            <input
              type="text"
              value={target.edgeNodeId || ''}
              onChange={(e) => onChange({ ...target, edgeNodeId: e.target.value })}
              placeholder="EdgeNode1"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500"
            />
          </div>

          {allowDevice && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Device ID (optional)
              </label>
              <input
                type="text"
                value={target.deviceIdNew || ''}
                onChange={(e) => onChange({ ...target, deviceIdNew: e.target.value })}
                placeholder="Device1"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Protocol Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          Protocol
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange({ ...target, protocol: 'SparkplugB' })}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              target.protocol === 'SparkplugB'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            ⚡ Sparkplug B
          </button>
          <button
            onClick={() => onChange({ ...target, protocol: 'RawMQTTv5' })}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              target.protocol === 'RawMQTTv5'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            📡 Raw MQTT v5
          </button>
        </div>
      </div>

      {/* Sparkplug B Specific Options */}
      {target.protocol === 'SparkplugB' && (
        <div className="space-y-3 border-t border-slate-800 pt-3">
          <div className="text-sm text-slate-400 mb-2">Sparkplug B Options</div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                bdSeq (Birth/Death Sequence)
              </label>
              <input
                type="number"
                value={target.bdSeq ?? 0}
                onChange={(e) => onChange({ ...target, bdSeq: parseInt(e.target.value) })}
                min={0}
                max={255}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                seq (Message Sequence)
              </label>
              <input
                type="number"
                value={target.seq ?? 0}
                onChange={(e) => onChange({ ...target, seq: parseInt(e.target.value) })}
                min={0}
                max={255}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-sm"
              />
            </div>
          </div>

          <div className="bg-amber-900/20 border border-amber-800/30 rounded p-2">
            <p className="text-xs text-amber-400">
              bdSeq: Incremented on each birth (0-255). seq: Incremented on each message (0-255).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
