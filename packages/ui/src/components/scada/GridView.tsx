/**
 * Grid View Component
 * Displays EoN nodes in a responsive grid layout
 */

import { useMemo } from 'react';
import { useSCADAStore } from '../../stores/scadaStore';
import { NodeCard } from './NodeCard';

export function GridView() {
  const { nodes, filter, setSelectedNode, setViewMode } = useSCADAStore();

  // Filter nodes based on filter criteria
  const filteredNodes = useMemo(() => {
    let filtered = Array.from(nodes.values());

    // Filter by group ID
    if (filter.groupId) {
      filtered = filtered.filter((node) => node.groupId === filter.groupId);
    }

    // Filter by search term (searches in edgeNodeId and groupId)
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (node) =>
          node.edgeNodeId.toLowerCase().includes(searchLower) ||
          node.groupId.toLowerCase().includes(searchLower)
      );
    }

    // Filter by online status
    if (filter.showOffline === false) {
      filtered = filtered.filter((node) => node.online);
    }

    // Filter by tags (protocol)
    if (filter.tags && filter.tags.length > 0) {
      // All nodes in this view are Sparkplug B
      if (!filter.tags.includes('SparkplugB')) {
        filtered = [];
      }
    }

    // Sort by group ID, then edge node ID
    filtered.sort((a, b) => {
      if (a.groupId !== b.groupId) {
        return a.groupId.localeCompare(b.groupId);
      }
      return a.edgeNodeId.localeCompare(b.edgeNodeId);
    });

    return filtered;
  }, [nodes, filter]);

  // Handle node selection
  const handleNodeSelect = (nodeKey: string) => {
    setSelectedNode(nodeKey);
    setViewMode('detail');
  };

  // Empty state
  if (filteredNodes.length === 0) {
    const hasActiveFilters = !!(
      filter.groupId ||
      filter.searchTerm ||
      filter.showOffline === false ||
      (filter.tags && filter.tags.length > 0)
    );

    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          {hasActiveFilters ? (
            <>
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Nodes Match Filters
              </h3>
              <p className="text-slate-400 mb-4">
                Try adjusting your filter criteria to see more results.
              </p>
              <button
                onClick={() => {
                  const { setFilter } = useSCADAStore.getState();
                  setFilter({
                    groupId: undefined,
                    searchTerm: undefined,
                    showOffline: true,
                    tags: undefined,
                  });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">📡</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Nodes Detected
              </h3>
              <p className="text-slate-400 mb-2">
                Waiting for Edge of Network nodes to connect...
              </p>
              <p className="text-sm text-slate-500">
                Start the simulator or connect real Sparkplug B devices
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Showing {filteredNodes.length} of {nodes.size} nodes
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {filteredNodes.filter((n) => n.online).length} online
          </span>
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredNodes.map((node) => {
          const nodeKey = `${node.groupId}/${node.edgeNodeId}`;
          return (
            <NodeCard
              key={nodeKey}
              node={node}
              onSelect={() => handleNodeSelect(nodeKey)}
            />
          );
        })}
      </div>

      {/* Footer Stats */}
      {filteredNodes.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Nodes</p>
              <p className="text-lg font-bold text-white">{filteredNodes.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Online</p>
              <p className="text-lg font-bold text-emerald-400">
                {filteredNodes.filter((n) => n.online).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Devices</p>
              <p className="text-lg font-bold text-white">
                {filteredNodes.reduce((sum, node) => sum + node.devices.length, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Metrics</p>
              <p className="text-lg font-bold text-white">
                {filteredNodes.reduce((sum, node) => sum + node.metrics.size, 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
