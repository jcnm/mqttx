/**
 * Device Card Component
 * Displays device information with metrics
 */

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Device } from '../../types/scada.types';
import { MetricGrid } from './MetricDisplay';

interface DeviceCardProps {
  device: Device;
  onSelect?: () => void;
  compact?: boolean;
}

export function DeviceCard({ device, onSelect, compact = false }: DeviceCardProps) {
  // Format last update
  const lastUpdate = useMemo(() => {
    if (!device.lastUpdate) return 'Never';
    const date = new Date(Number(device.lastUpdate));
    return formatDistanceToNow(date, { addSuffix: true });
  }, [device.lastUpdate]);

  // Get protocol tag
  const protocolTag = device.tags?.includes('SparkplugB')
    ? 'Sparkplug B'
    : device.tags?.includes('RawMQTTv5')
    ? 'Raw MQTT v5'
    : 'Unknown';

  const protocolColor = device.tags?.includes('SparkplugB')
    ? 'bg-blue-700'
    : 'bg-purple-700';

  // Get top metrics for compact view
  const topMetrics = useMemo(() => {
    if (!compact || device.metrics.size <= 3) {
      return device.metrics;
    }
    const metrics = Array.from(device.metrics.entries()).slice(0, 3);
    return new Map(metrics);
  }, [device.metrics, compact]);

  if (compact) {
    return (
      <div
        onClick={onSelect}
        className={`p-3 rounded-lg border-2 transition-all ${
          device.online
            ? 'bg-slate-800 border-blue-600 hover:border-blue-500'
            : 'bg-slate-800 border-slate-600 opacity-60'
        } ${onSelect ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className={`w-2 h-2 rounded-full ${
                device.online ? 'bg-blue-500 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <h4 className="text-sm font-semibold text-white truncate">
              {device.deviceId}
            </h4>
          </div>
          <span
            className={`px-2 py-0.5 text-xs font-semibold text-white rounded ${protocolColor}`}
          >
            {protocolTag}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{device.metrics.size} metrics</span>
          <span>{lastUpdate}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`bg-slate-800 rounded-lg border-2 transition-all ${
        device.online
          ? 'border-blue-600 hover:border-blue-500 shadow-blue-900/20 shadow-lg'
          : 'border-slate-600 opacity-75'
      } ${onSelect ? 'cursor-pointer' : ''}`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className={`w-3 h-3 rounded-full ${
                device.online ? 'bg-blue-500 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <h3 className="text-lg font-bold text-white truncate">
              {device.deviceId}
            </h3>
          </div>

          {/* Protocol Tag */}
          <span
            className={`px-2 py-1 text-xs font-semibold text-white rounded ${protocolColor}`}
          >
            {protocolTag}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-900 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Metrics</p>
            <p className="text-lg font-bold text-white">{device.metrics.size}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Status</p>
            <p
              className={`text-sm font-bold ${
                device.online ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              {device.online ? 'ONLINE' : 'OFFLINE'}
            </p>
          </div>
        </div>

        {/* Last Update */}
        <div className="text-xs text-slate-400 mb-3">
          <div className="flex justify-between">
            <span>Last Update:</span>
            <span className="text-slate-300">{lastUpdate}</span>
          </div>
        </div>

        {/* Tags */}
        {device.tags && device.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {device.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs font-medium text-slate-300 bg-slate-700 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Metrics */}
      {topMetrics.size > 0 && (
        <div className="px-4 pb-4 border-t border-slate-700 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white">Metrics</h4>
            {device.metrics.size > 3 && (
              <span className="text-xs text-slate-400">
                Showing {topMetrics.size} of {device.metrics.size}
              </span>
            )}
          </div>
          <MetricGrid metrics={topMetrics} compact />

          {/* View Details Button */}
          {onSelect && device.metrics.size > 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="w-full mt-3 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View All Metrics
            </button>
          )}
        </div>
      )}
    </div>
  );
}
