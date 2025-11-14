/**
 * STATE Indicator Component
 * Displays Sparkplug B Host Application STATE
 * Spec: ISO/IEC 20237:2023 Section 12
 */

import { useEffect, useState } from 'react';
import { useMQTTStore } from '../../stores/mqttStore';

interface HostState {
  online: boolean;
  timestamp: number;
  hostId: string;
}

export function StateIndicator() {
  const { messages, isConnected } = useMQTTStore();
  const [primaryHost, setPrimaryHost] = useState<HostState | null>(null);
  const [secondaryHosts, setSecondaryHosts] = useState<Map<string, HostState>>(new Map());

  useEffect(() => {
    // Listen for STATE messages on topic: STATE/scada_host
    const stateMessages = messages.filter((msg) => msg.topic.startsWith('STATE/'));

    stateMessages.forEach((msg) => {
      try {
        const parts = msg.topic.split('/');
        const hostId = parts[1] || 'unknown';

        // Decode STATE payload (JSON format)
        const decoder = new TextDecoder();
        const jsonStr = decoder.decode(new Uint8Array(msg.payload));
        const state: { online: boolean; timestamp: number } = JSON.parse(jsonStr);

        const hostState: HostState = {
          online: state.online,
          timestamp: state.timestamp,
          hostId,
        };

        // First STATE message is typically the primary host
        if (!primaryHost) {
          setPrimaryHost(hostState);
        } else if (hostState.hostId === primaryHost.hostId) {
          // Update primary host
          setPrimaryHost(hostState);
        } else {
          // Secondary/backup hosts
          setSecondaryHosts((prev) => {
            const next = new Map(prev);
            next.set(hostId, hostState);
            return next;
          });
        }
      } catch (error) {
        console.error('Failed to parse STATE message:', error);
      }
    });
  }, [messages, primaryHost]);

  // Auto-clear offline hosts after 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 seconds

      if (primaryHost && !primaryHost.online) {
        const age = now - primaryHost.timestamp;
        if (age > timeout) {
          setPrimaryHost(null);
        }
      }

      setSecondaryHosts((prev) => {
        const next = new Map();
        prev.forEach((host, id) => {
          const age = now - host.timestamp;
          if (host.online || age <= timeout) {
            next.set(id, host);
          }
        });
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [primaryHost]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span>🖥️</span>
        Host Application State
      </h4>

      {/* Primary Host */}
      {primaryHost ? (
        <div className="bg-slate-800 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  primaryHost.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-sm font-medium text-white">
                Primary: {primaryHost.hostId}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {new Date(primaryHost.timestamp).toLocaleTimeString()}
            </span>
          </div>
          {primaryHost.online ? (
            <p className="text-xs text-emerald-400 mt-1">● Active and monitoring</p>
          ) : (
            <p className="text-xs text-red-400 mt-1">● Offline - Failover may occur</p>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg p-3 mb-3 text-center">
          <p className="text-sm text-slate-400">No primary host detected</p>
          <p className="text-xs text-slate-500 mt-1">
            Waiting for STATE messages...
          </p>
        </div>
      )}

      {/* Secondary Hosts */}
      {secondaryHosts.size > 0 && (
        <>
          <p className="text-xs text-slate-400 mb-2 font-semibold">
            Backup Hosts ({secondaryHosts.size})
          </p>
          <div className="space-y-2">
            {Array.from(secondaryHosts.entries()).map(([id, host]) => (
              <div
                key={id}
                className="bg-slate-800/50 rounded-lg p-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      host.online ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-xs text-slate-300">{host.hostId}</span>
                </div>
                <span className="text-xs text-slate-500">
                  {host.online ? 'Standby' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Info Footer */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          {primaryHost && primaryHost.online
            ? '✓ Primary host is active'
            : '⚠️ No active primary host - system may be offline'}
        </p>
      </div>
    </div>
  );
}
