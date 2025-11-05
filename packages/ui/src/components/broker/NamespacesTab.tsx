/**
 * Namespaces Tab Component
 * Display all Sparkplug namespaces with group IDs and edge nodes
 */

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useBrokerStore } from '../../stores/brokerStore';

export function NamespacesTab() {
  const { namespaces, logs } = useBrokerStore();

  // Calculate namespace statistics
  const stats = useMemo(() => {
    const totalGroups = namespaces.size;
    const totalEdgeNodes = Array.from(namespaces.values()).reduce(
      (sum, ns) => sum + ns.edgeNodes.length,
      0
    );
    const totalDevices = Array.from(namespaces.values()).reduce(
      (sum, ns) => sum + ns.deviceCount,
      0
    );

    // Extract namespace prefixes from logs (e.g., "spBv1.0")
    const namespacePrefixes = new Set<string>();
    logs.forEach((log) => {
      if (log.topic && log.messageType) {
        const parts = log.topic.split('/');
        if (parts.length > 0) {
          namespacePrefixes.add(parts[0]);
        }
      }
    });

    return {
      totalGroups,
      totalEdgeNodes,
      totalDevices,
      namespaceCount: namespacePrefixes.size,
    };
  }, [namespaces, logs]);

  if (namespaces.size === 0) {
    return (
      <div className="space-y-4">
        {/* Stats showing zero state */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Namespaces</p>
            <p className="text-xl font-bold text-white">0</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Total Groups</p>
            <p className="text-xl font-bold text-blue-500">0</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Edge Nodes</p>
            <p className="text-xl font-bold text-emerald-500">0</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <p className="text-xs text-slate-400">Devices</p>
            <p className="text-xl font-bold text-yellow-500">0</p>
          </div>
        </div>

        <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-800">
          <div className="text-5xl mb-4">🏷️</div>
          <p className="text-slate-400">No Sparkplug namespaces detected</p>
          <p className="text-sm text-slate-500 mt-2">
            Namespaces will appear here when Sparkplug nodes publish birth certificates
          </p>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-400 mb-2">About Sparkplug Namespaces</h4>
              <p className="text-sm text-slate-400 mb-3">
                Sparkplug B uses namespaces to organize MQTT topics in a hierarchical structure:
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• <code className="text-yellow-400">spBv1.0</code> - Sparkplug B Version 1.0 (most common)</li>
                <li>• Groups organize related Edge of Network (EoN) nodes</li>
                <li>• Each EoN node can have multiple devices attached</li>
                <li>• Topic format: <code className="text-yellow-400">namespace/groupId/messageType/edgeNodeId/deviceId</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Namespaces</p>
          <p className="text-xl font-bold text-white">{stats.namespaceCount}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Total Groups</p>
          <p className="text-xl font-bold text-blue-500">{stats.totalGroups}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Edge Nodes</p>
          <p className="text-xl font-bold text-emerald-500">{stats.totalEdgeNodes}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Devices</p>
          <p className="text-xl font-bold text-yellow-500">{stats.totalDevices}</p>
        </div>
      </div>

      {/* Namespaces List */}
      <div className="space-y-4">
        {Array.from(namespaces.entries()).map(([groupId, namespace]) => (
          <div key={groupId} className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Group: {groupId}
                </h3>
                <p className="text-sm text-slate-400">
                  Last activity {formatDistanceToNow(namespace.lastActivity, { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Edge Nodes</div>
                  <div className="text-2xl font-bold text-emerald-500">
                    {namespace.edgeNodes.length}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Devices</div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {namespace.deviceCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Edge Nodes List */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Edge Nodes
              </h4>
              {namespace.edgeNodes.length === 0 ? (
                <p className="text-sm text-slate-500">No edge nodes in this group</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {namespace.edgeNodes.map((edgeNodeId) => (
                    <div
                      key={edgeNodeId}
                      className="bg-slate-800 rounded-lg p-3 border border-slate-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-semibold text-white font-mono">
                          {edgeNodeId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Topic: <span className="text-yellow-400 font-mono">
                          spBv1.0/{groupId}/NDATA/{edgeNodeId}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sparkplug Topic Structure Reference */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-4">
          Sparkplug B Topic Structure
        </h4>
        <div className="space-y-3 text-xs font-mono">
          <div className="bg-slate-800 rounded p-3">
            <div className="text-slate-400 mb-1">Node Birth:</div>
            <div className="text-emerald-400">
              spBv1.0/<span className="text-blue-400">[groupId]</span>/NBIRTH/<span className="text-yellow-400">[edgeNodeId]</span>
            </div>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <div className="text-slate-400 mb-1">Node Data:</div>
            <div className="text-blue-400">
              spBv1.0/<span className="text-blue-400">[groupId]</span>/NDATA/<span className="text-yellow-400">[edgeNodeId]</span>
            </div>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <div className="text-slate-400 mb-1">Device Birth:</div>
            <div className="text-emerald-400">
              spBv1.0/<span className="text-blue-400">[groupId]</span>/DBIRTH/<span className="text-yellow-400">[edgeNodeId]</span>/<span className="text-purple-400">[deviceId]</span>
            </div>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <div className="text-slate-400 mb-1">Device Data:</div>
            <div className="text-cyan-400">
              spBv1.0/<span className="text-blue-400">[groupId]</span>/DDATA/<span className="text-yellow-400">[edgeNodeId]</span>/<span className="text-purple-400">[deviceId]</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
