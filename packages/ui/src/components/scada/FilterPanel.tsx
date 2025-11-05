/**
 * Filter Panel Component
 * Controls for filtering nodes and devices in SCADA view
 */

import { useSCADAStore } from '../../stores/scadaStore';
import { useMemo } from 'react';

export function FilterPanel() {
  const { filter, setFilter, nodes } = useSCADAStore();

  // Extract unique group IDs from nodes
  const groupIds = useMemo(() => {
    const ids = new Set<string>();
    nodes.forEach((node) => ids.add(node.groupId));
    return Array.from(ids).sort();
  }, [nodes]);

  // Extract unique edge node IDs
  const edgeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    nodes.forEach((node) => ids.add(node.edgeNodeId));
    return Array.from(ids).sort();
  }, [nodes]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.groupId) count++;
    if (filter.searchTerm) count++;
    if (filter.showOffline === false) count++;
    if (filter.tags && filter.tags.length > 0) count++;
    return count;
  }, [filter]);

  const handleClearFilters = () => {
    setFilter({
      groupId: undefined,
      searchTerm: undefined,
      showOffline: true,
      tags: undefined,
    });
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-emerald-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Search
        </label>
        <input
          type="text"
          value={filter.searchTerm || ''}
          onChange={(e) => setFilter({ searchTerm: e.target.value || undefined })}
          placeholder="Filter by name..."
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
        />
      </div>

      {/* Group ID Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Group ID
        </label>
        <select
          value={filter.groupId || ''}
          onChange={(e) => setFilter({ groupId: e.target.value || undefined })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
        >
          <option value="">All Groups</option>
          {groupIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      {/* Edge Node ID Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Edge Node ID
        </label>
        <select
          value={filter.searchTerm || ''}
          onChange={(e) => setFilter({ searchTerm: e.target.value || undefined })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
        >
          <option value="">All Nodes</option>
          {edgeNodeIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      {/* Online Status Toggle */}
      <div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-slate-300">Show Offline</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={filter.showOffline !== false}
              onChange={(e) => setFilter({ showOffline: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </div>
        </label>
      </div>

      {/* Protocol Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Protocol
        </label>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filter.tags?.includes('SparkplugB') !== false}
              onChange={(e) => {
                const currentTags = filter.tags || [];
                if (e.target.checked) {
                  if (!currentTags.includes('SparkplugB')) {
                    setFilter({ tags: [...currentTags, 'SparkplugB'] });
                  }
                } else {
                  setFilter({
                    tags: currentTags.filter((t) => t !== 'SparkplugB'),
                  });
                }
              }}
              className="w-4 h-4 text-emerald-600 bg-slate-800 border-slate-700 rounded focus:ring-emerald-600 focus:ring-2"
            />
            <span className="ml-2 text-sm text-slate-300">Sparkplug B</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filter.tags?.includes('RawMQTTv5') !== false}
              onChange={(e) => {
                const currentTags = filter.tags || [];
                if (e.target.checked) {
                  if (!currentTags.includes('RawMQTTv5')) {
                    setFilter({ tags: [...currentTags, 'RawMQTTv5'] });
                  }
                } else {
                  setFilter({
                    tags: currentTags.filter((t) => t !== 'RawMQTTv5'),
                  });
                }
              }}
              className="w-4 h-4 text-emerald-600 bg-slate-800 border-slate-700 rounded focus:ring-emerald-600 focus:ring-2"
            />
            <span className="ml-2 text-sm text-slate-300">Raw MQTT v5</span>
          </label>
        </div>
      </div>

      {/* Filter Summary */}
      {activeFilterCount > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </p>
        </div>
      )}
    </div>
  );
}
