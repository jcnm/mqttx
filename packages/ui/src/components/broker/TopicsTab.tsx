/**
 * Topics Tab Component
 * Display all active subscriptions with tree visualization and wildcard analysis
 */

import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useBrokerStore } from '../../stores/brokerStore';
import type { Subscription } from '../../types/broker.types';

interface TopicNode {
  name: string;
  fullPath: string;
  subscribers: Set<string>;
  children: Map<string, TopicNode>;
  isWildcard: boolean;
  lastActivity: number;
}

function buildTopicTree(subscriptions: Subscription[]): TopicNode {
  const root: TopicNode = {
    name: 'root',
    fullPath: '',
    subscribers: new Set(),
    children: new Map(),
    isWildcard: false,
    lastActivity: 0,
  };

  subscriptions.forEach((sub) => {
    const parts = sub.topic.split('/');
    let current = root;
    let path = '';

    parts.forEach((part, idx) => {
      path = idx === 0 ? part : `${path}/${part}`;
      const isWildcard = part === '+' || part === '#';

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          fullPath: path,
          subscribers: new Set(),
          children: new Map(),
          isWildcard,
          lastActivity: 0,
        });
      }

      current = current.children.get(part)!;
      current.subscribers.add(sub.clientId);
      current.lastActivity = Math.max(current.lastActivity, sub.subscribedAt);
    });
  });

  return root;
}

function TopicTreeNode({ node, level = 0 }: { node: TopicNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children.size > 0;
  const indent = level * 24;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-800/50 transition-colors cursor-pointer group ${
          node.subscribers.size > 0 ? 'text-slate-200' : 'text-slate-500'
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse Icon */}
        <span className="text-sm w-4">
          {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
        </span>

        {/* Node Name */}
        <span
          className={`text-sm font-mono flex-1 ${
            node.isWildcard
              ? 'text-yellow-400 font-bold'
              : node.subscribers.size > 0
                ? 'text-blue-400'
                : 'text-slate-500'
          }`}
        >
          {node.name}
          {node.isWildcard && (
            <span className="ml-2 text-xs text-slate-500">
              (wildcard: {node.name === '#' ? 'multi-level' : 'single-level'})
            </span>
          )}
        </span>

        {/* Subscriber Count Badge */}
        {node.subscribers.size > 0 && (
          <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
            {node.subscribers.size} sub{node.subscribers.size !== 1 ? 's' : ''}
          </span>
        )}

        {/* Subscribers (on hover) */}
        {node.subscribers.size > 0 && (
          <div className="hidden group-hover:flex items-center gap-1">
            {Array.from(node.subscribers)
              .slice(0, 3)
              .map((clientId) => (
                <span
                  key={clientId}
                  className="text-xs px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-400"
                >
                  {clientId}
                </span>
              ))}
            {node.subscribers.size > 3 && (
              <span className="text-xs text-slate-500">+{node.subscribers.size - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {Array.from(node.children.values())
            .sort((a, b) => {
              // Sort wildcards first, then by subscriber count
              if (a.isWildcard !== b.isWildcard) return a.isWildcard ? -1 : 1;
              return b.subscribers.size - a.subscribers.size;
            })
            .map((child) => (
              <TopicTreeNode key={child.name} node={child} level={level + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

export function TopicsTab() {
  const { subscriptions, logs } = useBrokerStore();
  const [searchQuery, setSearchQuery] = useState('');

  const topicTree = useMemo(() => buildTopicTree(subscriptions), [subscriptions]);

  // Calculate topic statistics from logs
  const topicStats = useMemo(() => {
    const stats = new Map<string, { count: number; lastActivity: number }>();

    logs.forEach((log) => {
      if (log.topic) {
        const existing = stats.get(log.topic) || { count: 0, lastActivity: 0 };
        stats.set(log.topic, {
          count: existing.count + 1,
          lastActivity: Math.max(existing.lastActivity, log.timestamp),
        });
      }
    });

    return stats;
  }, [logs]);

  // Filter subscriptions by search
  const filteredSubscriptions = useMemo(() => {
    if (!searchQuery) return subscriptions;
    return subscriptions.filter(
      (sub) =>
        sub.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.clientId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subscriptions, searchQuery]);

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📮</div>
        <p className="text-slate-400">No active subscriptions</p>
        <p className="text-sm text-slate-500 mt-2">
          Topic subscriptions will appear here when clients subscribe to topics
        </p>
      </div>
    );
  }

  // Count wildcards
  const wildcardCount = subscriptions.filter((sub) => sub.topic.includes('+') || sub.topic.includes('#')).length;
  const uniqueTopics = new Set(subscriptions.map((sub) => sub.topic)).size;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics or client IDs..."
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Total Subscriptions</p>
          <p className="text-xl font-bold text-white">{subscriptions.length}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Unique Topics</p>
          <p className="text-xl font-bold text-blue-500">{uniqueTopics}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Wildcard Subs</p>
          <p className="text-xl font-bold text-yellow-500">{wildcardCount}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Active Topics</p>
          <p className="text-xl font-bold text-emerald-500">{topicStats.size}</p>
        </div>
      </div>

      {/* Topic Tree Visualization */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-300">Topic Hierarchy</h4>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Topic
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              Wildcard
            </span>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {Array.from(topicTree.children.values())
            .sort((a, b) => b.subscribers.size - a.subscribers.size)
            .map((child) => (
              <TopicTreeNode key={child.name} node={child} level={0} />
            ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900 rounded-lg border border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300">
            All Subscriptions ({filteredSubscriptions.length})
          </h4>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-800 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Topic
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Client ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  QoS
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Subscribed
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Messages
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSubscriptions.map((sub, idx) => {
                const stats = topicStats.get(sub.topic);
                return (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs text-yellow-400 font-mono">{sub.topic}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-blue-400 font-mono">{sub.clientId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-300">{sub.qos}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(sub.subscribedAt, { addSuffix: true })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {stats ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-400 font-semibold">{stats.count}</span>
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(stats.lastActivity, { addSuffix: true })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
