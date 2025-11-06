/**
 * Tree View Component
 * Hierarchical topic structure with collapsible nodes
 */

import { useMemo, useState } from 'react';
import type { BrokerLog } from '../../../types/broker.types';

interface TreeViewProps {
  logs: BrokerLog[];
}

interface TreeNode {
  name: string;
  fullPath: string;
  messageCount: number;
  children: Map<string, TreeNode>;
  isActive: boolean;
  messageTypes: Map<string, number>;
}

function buildTree(logs: BrokerLog[]): TreeNode {
  const root: TreeNode = {
    name: 'root',
    fullPath: '',
    messageCount: 0,
    children: new Map(),
    isActive: false,
    messageTypes: new Map(),
  };

  logs.forEach((log) => {
    if (!log.topic) return;

    const parts = log.topic.split('/');
    let current = root;
    let path = '';

    parts.forEach((part, idx) => {
      path = idx === 0 ? part : `${path}/${part}`;

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          fullPath: path,
          messageCount: 0,
          children: new Map(),
          isActive: false,
          messageTypes: new Map(),
        });
      }

      current = current.children.get(part)!;
      current.messageCount++;
      current.isActive = true;

      if (log.messageType) {
        const count = current.messageTypes.get(log.messageType) || 0;
        current.messageTypes.set(log.messageType, count + 1);
      }
    });
  });

  return root;
}

function TreeNodeComponent({
  node,
  level = 0,
}: {
  node: TreeNode;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const hasChildren = node.children.size > 0;
  const indent = level * 24;

  // Get dominant message type
  const dominantType = Array.from(node.messageTypes.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

  const typeColors: Record<string, string> = {
    NBIRTH: 'text-green-500',
    NDATA: 'text-blue-500',
    NDEATH: 'text-red-500',
    DBIRTH: 'text-emerald-500',
    DDATA: 'text-cyan-500',
    DDEATH: 'text-pink-500',
    NCMD: 'text-purple-500',
    DCMD: 'text-violet-500',
    STATE: 'text-yellow-500',
  };

  const typeColor = dominantType ? typeColors[dominantType] || 'text-slate-400' : 'text-slate-400';

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-800/50 transition-colors cursor-pointer group ${
          node.isActive ? 'text-slate-200' : 'text-slate-500'
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse Icon */}
        <span className="text-sm w-4">
          {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
        </span>

        {/* Node Name */}
        <span className={`text-sm font-mono flex-1 ${typeColor}`}>
          {node.name}
        </span>

        {/* Message Count Badge */}
        {node.messageCount > 0 && (
          <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
            {node.messageCount}
          </span>
        )}

        {/* Message Type Badges (on hover) */}
        {node.messageTypes.size > 0 && (
          <div className="hidden group-hover:flex items-center gap-1">
            {Array.from(node.messageTypes.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([type, count]) => (
                <span
                  key={type}
                  className={`text-xs px-1.5 py-0.5 rounded ${typeColors[type] || 'text-slate-400'} bg-slate-900/80`}
                >
                  {type}:{count}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {Array.from(node.children.values())
            .sort((a, b) => b.messageCount - a.messageCount)
            .map((child) => (
              <TreeNodeComponent key={child.name} node={child} level={level + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

export function TreeView({ logs }: TreeViewProps) {
  const tree = useMemo(() => buildTree(logs), [logs]);

  if (logs.length === 0 || tree.children.size === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <div className="text-center">
          <div className="text-5xl mb-4">🌳</div>
          <p>No topics to display</p>
          <p className="text-sm text-slate-500 mt-2">Topic hierarchy will appear here as messages are published</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Total Topics</p>
          <p className="text-xl font-bold text-white">{tree.children.size}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Total Messages</p>
          <p className="text-xl font-bold text-white">{tree.messageCount}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Active Paths</p>
          <p className="text-xl font-bold text-white">
            {logs.filter((log) => log.topic).length}
          </p>
        </div>
      </div>

      {/* Tree */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-300">Topic Hierarchy</h4>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>▶ = Collapsed</span>
            <span>▼ = Expanded</span>
            <span>• = Leaf</span>
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {Array.from(tree.children.values())
            .sort((a, b) => b.messageCount - a.messageCount)
            .map((child) => (
              <TreeNodeComponent key={child.name} node={child} level={0} />
            ))}
        </div>
      </div>

      {/* Message Type Legend */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Message Types</h4>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {[
            { type: 'NBIRTH', color: 'text-green-500', desc: 'Node Birth' },
            { type: 'NDATA', color: 'text-blue-500', desc: 'Node Data' },
            { type: 'NDEATH', color: 'text-red-500', desc: 'Node Death' },
            { type: 'DBIRTH', color: 'text-emerald-500', desc: 'Device Birth' },
            { type: 'DDATA', color: 'text-cyan-500', desc: 'Device Data' },
            { type: 'DDEATH', color: 'text-pink-500', desc: 'Device Death' },
            { type: 'NCMD', color: 'text-purple-500', desc: 'Node Cmd' },
            { type: 'DCMD', color: 'text-violet-500', desc: 'Device Cmd' },
            { type: 'STATE', color: 'text-yellow-500', desc: 'State' },
          ].map((item) => (
            <div key={item.type} className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${item.color}`}>{item.type}</span>
              <span className="text-xs text-slate-500">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
