/**
 * Tree View Component
 * Hierarchical display of Sparkplug namespace structure
 * Format: Namespace → Group ID → Edge Node → Devices
 */

import { useState, useMemo } from 'react';
import { useSCADAStore } from '../../stores/scadaStore';
import type { EoNNode } from '../../types/scada.types';

interface TreeNodeProps {
  label: string;
  online?: boolean;
  count?: number;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
  children?: React.ReactNode;
  type?: 'namespace' | 'group' | 'node' | 'device';
}

function TreeNode({
  label,
  online,
  count,
  level,
  isExpanded,
  onToggle,
  onClick,
  children,
  type = 'node',
}: TreeNodeProps) {
  const indentClass = `pl-${level * 4}`;
  const hasChildren = !!children;

  // Color coding by type
  const getTypeColor = () => {
    switch (type) {
      case 'namespace':
        return 'text-purple-400';
      case 'group':
        return 'text-blue-400';
      case 'node':
        return 'text-emerald-400';
      case 'device':
        return 'text-cyan-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer group ${indentClass}`}
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Online Status Indicator */}
        {online !== undefined && (
          <span
            className={`w-2 h-2 rounded-full ${
              online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}
          />
        )}

        {/* Label */}
        <span
          onClick={onClick}
          className={`flex-1 font-medium ${getTypeColor()} group-hover:text-white transition-colors`}
        >
          {label}
        </span>

        {/* Count Badge */}
        {count !== undefined && count > 0 && (
          <span className="px-2 py-0.5 text-xs font-semibold text-slate-400 bg-slate-700 rounded">
            {count}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && <div>{children}</div>}
    </div>
  );
}

export function TreeView() {
  const { nodes, setSelectedNode, setSelectedDevice, setViewMode } = useSCADAStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Group nodes by namespace and group ID
  const tree = useMemo(() => {
    const namespaces = new Map<
      string,
      Map<string, { node: EoNNode; key: string }[]>
    >();

    nodes.forEach((node, key) => {
      const namespace = 'spBv1.0'; // All Sparkplug B nodes use this namespace

      if (!namespaces.has(namespace)) {
        namespaces.set(namespace, new Map());
      }

      const groups = namespaces.get(namespace)!;
      if (!groups.has(node.groupId)) {
        groups.set(node.groupId, []);
      }

      groups.get(node.groupId)!.push({ node, key });
    });

    return namespaces;
  }, [nodes]);

  const toggleExpand = (key: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleNodeClick = (nodeKey: string) => {
    setSelectedNode(nodeKey);
    setViewMode('detail');
  };

  const handleDeviceClick = (deviceId: string) => {
    setSelectedDevice(deviceId);
    setViewMode('detail');
  };

  // Empty state
  if (tree.size === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🌳</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Namespace Data
          </h3>
          <p className="text-slate-400">
            Waiting for Sparkplug B nodes to connect...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tree Header */}
      <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Sparkplug Namespace Hierarchy
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded" />
              <span>Namespace</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded" />
              <span>Group</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded" />
              <span>Node</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded" />
              <span>Device</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tree Structure */}
      <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 max-h-[600px] overflow-y-auto">
        {Array.from(tree.entries()).map(([namespace, groups]) => (
          <TreeNode
            key={namespace}
            label={namespace}
            type="namespace"
            level={0}
            isExpanded={expandedNodes.has(namespace)}
            onToggle={() => toggleExpand(namespace)}
            count={nodes.size}
          >
            {Array.from(groups.entries()).map(([groupId, groupNodes]) => {
              const groupKey = `${namespace}/${groupId}`;

              return (
                <TreeNode
                  key={groupKey}
                  label={groupId}
                  type="group"
                  level={1}
                  isExpanded={expandedNodes.has(groupKey)}
                  onToggle={() => toggleExpand(groupKey)}
                  count={groupNodes.length}
                >
                  {groupNodes.map(({ node, key: nodeKey }) => {
                    const edgeNodeKey = `${groupKey}/${node.edgeNodeId}`;

                    return (
                      <TreeNode
                        key={edgeNodeKey}
                        label={node.edgeNodeId}
                        type="node"
                        online={node.online}
                        level={2}
                        isExpanded={expandedNodes.has(edgeNodeKey)}
                        onToggle={() => toggleExpand(edgeNodeKey)}
                        onClick={() => handleNodeClick(nodeKey)}
                        count={node.metrics.size}
                      >
                        {node.devices.length > 0 && (
                          <div className="space-y-1">
                            {node.devices.map((device) => (
                              <TreeNode
                                key={device.deviceId}
                                label={device.deviceId}
                                type="device"
                                online={device.online}
                                level={3}
                                isExpanded={false}
                                onToggle={() => {}}
                                onClick={() => handleDeviceClick(device.deviceId)}
                                count={device.metrics.size}
                              />
                            ))}
                          </div>
                        )}
                      </TreeNode>
                    );
                  })}
                </TreeNode>
              );
            })}
          </TreeNode>
        ))}
      </div>

      {/* Tree Statistics */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h4 className="text-sm font-semibold text-white mb-3">Tree Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-400 mb-1">Namespaces</p>
            <p className="text-lg font-bold text-purple-400">{tree.size}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Groups</p>
            <p className="text-lg font-bold text-blue-400">
              {Array.from(tree.values()).reduce((sum, groups) => sum + groups.size, 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Nodes</p>
            <p className="text-lg font-bold text-emerald-400">{nodes.size}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Devices</p>
            <p className="text-lg font-bold text-cyan-400">
              {Array.from(nodes.values()).reduce(
                (sum, node) => sum + node.devices.length,
                0
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
