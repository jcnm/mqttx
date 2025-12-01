/**
 * Persistence Tab Component
 * Display Redis connection status and persistence statistics
 */

import { useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  FileText,
  Server,
  Smartphone,
  HardDrive,
  AlertTriangle,
  Info,
} from 'lucide-react';

export function PersistenceTab() {
  // Mock Redis connection status (will be replaced with real data from store)
  const [redisConnected] = useState(true);
  const [stats] = useState({
    birthCertificates: 0,
    nodeStates: 0,
    deviceStates: 0,
    readsPerSecond: 0,
    writesPerSecond: 0,
    memoryUsage: 0,
    uptime: 0,
    lastBackup: Date.now() - 3600000, // 1 hour ago
  });

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleClearCache = () => {
    if (
      confirm(
        'This will clear all cached data including birth certificates and node states. Are you sure?'
      )
    ) {
      // TODO: Implement cache clearing
      alert('Cache clearing not yet implemented');
    }
  };

  return (
    <div className="space-y-4">
      {/* Redis Connection Status */}
      <div className={`rounded-lg border p-6 ${
        redisConnected
          ? 'bg-green-900/20 border-green-800/30'
          : 'bg-red-900/20 border-red-800/30'
      }`}>
        <div className="flex items-start gap-4">
          {redisConnected ? (
            <CheckCircle className={`w-10 h-10 text-green-400 ${redisConnected ? 'animate-pulse' : ''}`} />
          ) : (
            <XCircle className="w-10 h-10 text-red-400" />
          )}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-1 ${
              redisConnected ? 'text-green-400' : 'text-red-400'
            }`}>
              Redis {redisConnected ? 'Connected' : 'Disconnected'}
            </h3>
            <p className="text-sm text-slate-400">
              {redisConnected
                ? 'Persistence layer is operational and storing data'
                : 'Unable to connect to Redis server. Persistence is disabled.'}
            </p>
          </div>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span className="text-xs text-slate-400">Birth Certificates</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500">{stats.birthCertificates}</p>
          <p className="text-xs text-slate-500 mt-1">Stored in cache</p>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-6 h-6 text-blue-400" />
            <span className="text-xs text-slate-400">Node States</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">{stats.nodeStates}</p>
          <p className="text-xs text-slate-500 mt-1">Cached nodes</p>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-6 h-6 text-yellow-400" />
            <span className="text-xs text-slate-400">Device States</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500">{stats.deviceStates}</p>
          <p className="text-xs text-slate-500 mt-1">Cached devices</p>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-6 h-6 text-purple-400" />
            <span className="text-xs text-slate-400">Memory Usage</span>
          </div>
          <p className="text-2xl font-bold text-purple-500">{formatBytes(stats.memoryUsage)}</p>
          <p className="text-xs text-slate-500 mt-1">Redis memory</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-4">Performance Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reads/Writes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Operations Per Second</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">Reads</span>
                  <span className="text-sm font-semibold text-emerald-500">
                    {stats.readsPerSecond.toFixed(1)} ops/s
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(stats.readsPerSecond, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">Writes</span>
                  <span className="text-sm font-semibold text-blue-500">
                    {stats.writesPerSecond.toFixed(1)} ops/s
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min(stats.writesPerSecond, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Uptime & Backup */}
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Redis Uptime</div>
              <div className="text-lg font-semibold text-white">
                {stats.uptime === 0
                  ? 'Not connected'
                  : `${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m`}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Last Backup</div>
              <div className="text-lg font-semibold text-white">
                {stats.lastBackup ? format(stats.lastBackup, 'MMM dd, HH:mm') : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Structure Info */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-4">Stored Data Structure</h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-slate-200 mb-1">Birth Certificates</div>
              <div className="text-xs text-slate-400">
                Sparkplug NBIRTH and DBIRTH payloads stored with full metric definitions.
                Used for state recovery and new primary application synchronization.
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                Key format: birth:&#123;groupId&#125;:&#123;edgeNodeId&#125;[:&#123;deviceId&#125;]
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Server className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-slate-200 mb-1">Node States</div>
              <div className="text-xs text-slate-400">
                Current state of all Edge of Network nodes including online status,
                sequence numbers, and latest metric values.
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                Key format: node:&#123;groupId&#125;:&#123;edgeNodeId&#125;
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-slate-200 mb-1">Device States</div>
              <div className="text-xs text-slate-400">
                Current state of all devices attached to EoN nodes including
                metric values and online status.
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                Key format: device:&#123;groupId&#125;:&#123;edgeNodeId&#125;:&#123;deviceId&#125;
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-4">Cache Management</h4>
        <div className="space-y-3">
          <button
            onClick={handleClearCache}
            disabled={!redisConnected}
            className="w-full px-4 py-3 bg-red-900/20 text-red-400 border border-red-800/30 rounded-lg text-sm font-medium hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
          >
            <span>Clear All Cached Data</span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <AlertTriangle className="w-3 h-3" /> Irreversible
            </span>
          </button>

          <div className="flex gap-3">
            <button
              disabled={!redisConnected}
              className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Backup
            </button>
            <button
              disabled={!redisConnected}
              className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import Backup
            </button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-400 mb-2">About Persistence</h4>
            <p className="text-sm text-slate-400 mb-3">
              Redis is used to store Sparkplug state for:
            </p>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• <strong className="text-slate-300">State of the World</strong> - All current metric values</li>
              <li>• <strong className="text-slate-300">Birth Certificates</strong> - Full metric definitions for recovery</li>
              <li>• <strong className="text-slate-300">Primary Application</strong> - Enable state sync for new applications</li>
              <li>• <strong className="text-slate-300">Sequence Numbers</strong> - Track bdSeq and seq for consistency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
