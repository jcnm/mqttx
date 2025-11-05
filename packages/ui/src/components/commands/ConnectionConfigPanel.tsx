/**
 * Connection Configuration Panel
 * Configure MQTT broker connection with TLS support
 */

import { useState, useEffect } from 'react';

export interface MQTTConnectionConfig {
  url: string;
  port: number;
  protocol: 'mqtt' | 'mqtts' | 'ws' | 'wss';
  username?: string;
  password?: string;
  clientId?: string;

  // TLS Configuration
  useTLS: boolean;
  tlsPort?: number;
  rejectUnauthorized: boolean;
  ca?: string; // CA Certificate content
  cert?: string; // Client Certificate
  key?: string; // Client Key

  // MQTT Options
  cleanSession: boolean;
  keepalive: number;
  reconnectPeriod: number;
  qos: 0 | 1 | 2;
}

interface ConnectionConfigPanelProps {
  config: MQTTConnectionConfig | null;
  onChange: (config: MQTTConnectionConfig) => void;
  onTest?: () => Promise<boolean>;
}

const getDefaultConfig = (): MQTTConnectionConfig => ({
  url: import.meta.env.VITE_BROKER_URL?.replace(/^wss?:\/\//, '').replace(/:\d+$/, '') || 'localhost',
  port: 8083,
  protocol: 'ws',
  clientId: `command-sender-${Math.random().toString(16).slice(2, 8)}`,
  useTLS: false,
  rejectUnauthorized: true,
  cleanSession: true,
  keepalive: 60,
  reconnectPeriod: 1000,
  qos: 1,
});

export function ConnectionConfigPanel({ config, onChange, onTest }: ConnectionConfigPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTLS, setShowTLS] = useState(config?.useTLS || false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Initialize with defaults if config is null - only once on mount
  useEffect(() => {
    if (!config) {
      onChange(getDefaultConfig());
    }
  }, []); // Empty deps to run only once

  // Show loading state while config is being initialized
  if (!config) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-slate-400">Loading configuration...</div>
        </div>
      </div>
    );
  }

  const handleTest = async () => {
    if (!onTest) return;

    setTesting(true);
    setTestResult(null);

    try {
      const success = await onTest();
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const handleFileUpload = (field: 'ca' | 'cert' | 'key') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pem,.crt,.key';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          onChange({
            ...config,
            [field]: event.target?.result as string,
          });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">MQTT Connection</h3>
        {testResult && (
          <span
            className={`text-sm px-3 py-1 rounded ${
              testResult === 'success'
                ? 'bg-emerald-900/50 text-emerald-400'
                : 'bg-red-900/50 text-red-400'
            }`}
          >
            {testResult === 'success' ? '✓ Connected' : '✗ Connection Failed'}
          </span>
        )}
      </div>

      {/* Basic Settings */}
      <div className="space-y-4">
        {/* Protocol */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Protocol
          </label>
          <select
            value={config.protocol}
            onChange={(e) =>
              onChange({
                ...config,
                protocol: e.target.value as MQTTConnectionConfig['protocol'],
              })
            }
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="mqtt">MQTT (TCP)</option>
            <option value="mqtts">MQTTS (TCP + TLS)</option>
            <option value="ws">WebSocket</option>
            <option value="wss">WebSocket Secure</option>
          </select>
        </div>

        {/* URL and Port */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Broker URL
            </label>
            <input
              type="text"
              value={config.url}
              onChange={(e) => onChange({ ...config, url: e.target.value })}
              placeholder="ws://localhost:8083"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Port
            </label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => onChange({ ...config, port: parseInt(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Authentication */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Username (optional)
            </label>
            <input
              type="text"
              value={config.username || ''}
              onChange={(e) => onChange({ ...config, username: e.target.value })}
              placeholder="username"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Password (optional)
            </label>
            <input
              type="password"
              value={config.password || ''}
              onChange={(e) => onChange({ ...config, password: e.target.value })}
              placeholder="password"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* TLS Configuration */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="useTLS"
              checked={showTLS}
              onChange={(e) => {
                setShowTLS(e.target.checked);
                onChange({ ...config, useTLS: e.target.checked });
              }}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-600"
            />
            <label htmlFor="useTLS" className="text-sm font-medium text-slate-300">
              Use TLS/SSL Encryption
            </label>
          </div>

          {showTLS && (
            <div className="pl-6 space-y-3 border-l-2 border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    TLS Port
                  </label>
                  <input
                    type="number"
                    value={config.tlsPort || 8883}
                    onChange={(e) =>
                      onChange({ ...config, tlsPort: parseInt(e.target.value) })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.rejectUnauthorized}
                      onChange={(e) =>
                        onChange({ ...config, rejectUnauthorized: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-600"
                    />
                    <span className="text-sm text-slate-300">Verify Certificate</span>
                  </label>
                </div>
              </div>

              {/* Certificate Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-400">
                    CA Certificate
                  </label>
                  <button
                    onClick={() => handleFileUpload('ca')}
                    className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
                  >
                    Upload .pem
                  </button>
                </div>
                {config.ca && (
                  <div className="text-xs text-emerald-400">✓ CA Certificate loaded</div>
                )}

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-400">
                    Client Certificate
                  </label>
                  <button
                    onClick={() => handleFileUpload('cert')}
                    className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
                  >
                    Upload .crt
                  </button>
                </div>
                {config.cert && (
                  <div className="text-xs text-emerald-400">✓ Client Certificate loaded</div>
                )}

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-400">
                    Client Key
                  </label>
                  <button
                    onClick={() => handleFileUpload('key')}
                    className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
                  >
                    Upload .key
                  </button>
                </div>
                {config.key && (
                  <div className="text-xs text-emerald-400">✓ Client Key loaded</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-2"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Options
        </button>

        {showAdvanced && (
          <div className="space-y-3 pl-4 border-l-2 border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={config.clientId || ''}
                onChange={(e) => onChange({ ...config, clientId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Keepalive (seconds)
                </label>
                <input
                  type="number"
                  value={config.keepalive}
                  onChange={(e) =>
                    onChange({ ...config, keepalive: parseInt(e.target.value) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  QoS Level
                </label>
                <select
                  value={config.qos}
                  onChange={(e) =>
                    onChange({ ...config, qos: parseInt(e.target.value) as 0 | 1 | 2 })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value={0}>0 - At most once</option>
                  <option value={1}>1 - At least once</option>
                  <option value={2}>2 - Exactly once</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cleanSession"
                checked={config.cleanSession}
                onChange={(e) =>
                  onChange({ ...config, cleanSession: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-600"
              />
              <label htmlFor="cleanSession" className="text-sm text-slate-300">
                Clean Session
              </label>
            </div>
          </div>
        )}

        {/* Test Connection Button */}
        <button
          onClick={handleTest}
          disabled={testing || !onTest}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {testing ? '⏳ Testing...' : '🔍 Test Connection'}
        </button>
      </div>
    </div>
  );
}
