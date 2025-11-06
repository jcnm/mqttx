/**
 * Settings Modal Component
 * Configure broker connection and simulator defaults
 */

import { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMQTTStore } from '../../stores/mqttStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'broker' | 'simulator';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('broker');
  const { brokerConfig, simulatorDefaults, updateBrokerConfig, updateSimulatorDefaults } = useSettingsStore();
  const { connect, disconnect, isConnected } = useMQTTStore();

  const [localBrokerConfig, setLocalBrokerConfig] = useState(brokerConfig);
  const [localSimulatorDefaults, setLocalSimulatorDefaults] = useState(simulatorDefaults);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // Update broker config
    updateBrokerConfig(localBrokerConfig);
    updateSimulatorDefaults(localSimulatorDefaults);

    // Reconnect with new settings if currently connected
    if (isConnected) {
      disconnect();
      setTimeout(() => {
        const newBrokerUrl = `${localBrokerConfig.protocol}://${localBrokerConfig.url}:${localBrokerConfig.port}`;
        connect(newBrokerUrl);
      }, 500);
    }

    onClose();
  };

  const handleCancel = () => {
    // Reset to stored values
    setLocalBrokerConfig(brokerConfig);
    setLocalSimulatorDefaults(simulatorDefaults);
    onClose();
  };

  const currentBrokerUrl = `${localBrokerConfig.protocol}://${localBrokerConfig.url}:${localBrokerConfig.port}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-slate-700">
          <div className="flex gap-1">
            {[
              { id: 'broker' as const, label: 'Broker Connection', icon: '🔌' },
              { id: 'simulator' as const, label: 'Simulator Defaults', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Broker Tab */}
          {activeTab === 'broker' && (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <h4 className="font-semibold text-blue-400 mb-1">Connection URL Preview</h4>
                    <p className="text-sm text-slate-300 font-mono">{currentBrokerUrl}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Protocol
                  </label>
                  <select
                    value={localBrokerConfig.protocol}
                    onChange={(e) =>
                      setLocalBrokerConfig({
                        ...localBrokerConfig,
                        protocol: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  >
                    <option value="ws">WebSocket (ws://)</option>
                    <option value="wss">WebSocket Secure (wss://)</option>
                    <option value="mqtt">MQTT (mqtt://)</option>
                    <option value="mqtts">MQTT Secure (mqtts://)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={localBrokerConfig.port}
                    onChange={(e) =>
                      setLocalBrokerConfig({
                        ...localBrokerConfig,
                        port: parseInt(e.target.value) || 8083,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Broker URL / Host
                </label>
                <input
                  type="text"
                  value={localBrokerConfig.url}
                  onChange={(e) =>
                    setLocalBrokerConfig({ ...localBrokerConfig, url: e.target.value })
                  }
                  placeholder="localhost or broker.example.com"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Username (optional)
                  </label>
                  <input
                    type="text"
                    value={localBrokerConfig.username || ''}
                    onChange={(e) =>
                      setLocalBrokerConfig({ ...localBrokerConfig, username: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Password (optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={localBrokerConfig.password || ''}
                      onChange={(e) =>
                        setLocalBrokerConfig({ ...localBrokerConfig, password: e.target.value || undefined })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Client ID Prefix
                </label>
                <input
                  type="text"
                  value={localBrokerConfig.clientIdPrefix}
                  onChange={(e) =>
                    setLocalBrokerConfig({ ...localBrokerConfig, clientIdPrefix: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Random suffix will be added automatically
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Keep Alive (seconds)
                  </label>
                  <input
                    type="number"
                    value={localBrokerConfig.keepAlive}
                    onChange={(e) =>
                      setLocalBrokerConfig({
                        ...localBrokerConfig,
                        keepAlive: parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Reconnect Period (ms)
                  </label>
                  <input
                    type="number"
                    value={localBrokerConfig.reconnectPeriod}
                    onChange={(e) =>
                      setLocalBrokerConfig({
                        ...localBrokerConfig,
                        reconnectPeriod: parseInt(e.target.value) || 5000,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cleanSession"
                  checked={localBrokerConfig.cleanSession}
                  onChange={(e) =>
                    setLocalBrokerConfig({ ...localBrokerConfig, cleanSession: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded"
                />
                <label htmlFor="cleanSession" className="text-sm text-slate-300">
                  Clean Session (Start fresh on each connection)
                </label>
              </div>
            </div>
          )}

          {/* Simulator Defaults Tab */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <h4 className="font-semibold text-emerald-400 mb-1">Default Configuration</h4>
                    <p className="text-sm text-slate-300">
                      These values will be used as defaults when creating new EoN nodes
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Default Group ID
                </label>
                <input
                  type="text"
                  value={localSimulatorDefaults.groupId}
                  onChange={(e) =>
                    setLocalSimulatorDefaults({ ...localSimulatorDefaults, groupId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    bdSeq Strategy
                  </label>
                  <select
                    value={localSimulatorDefaults.bdSeqStrategy}
                    onChange={(e) =>
                      setLocalSimulatorDefaults({
                        ...localSimulatorDefaults,
                        bdSeqStrategy: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  >
                    <option value="sequential">Sequential</option>
                    <option value="random">Random</option>
                    <option value="timestamp">Timestamp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Rebirth Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={localSimulatorDefaults.rebirthTimeout}
                    onChange={(e) =>
                      setLocalSimulatorDefaults({
                        ...localSimulatorDefaults,
                        rebirthTimeout: parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Default QoS
                  </label>
                  <select
                    value={localSimulatorDefaults.qos}
                    onChange={(e) =>
                      setLocalSimulatorDefaults({
                        ...localSimulatorDefaults,
                        qos: parseInt(e.target.value) as 0 | 1 | 2,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  >
                    <option value="0">0 - At most once</option>
                    <option value="1">1 - At least once</option>
                    <option value="2">2 - Exactly once</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Data Frequency (ms)
                  </label>
                  <input
                    type="number"
                    value={localSimulatorDefaults.dataFrequency}
                    onChange={(e) =>
                      setLocalSimulatorDefaults({
                        ...localSimulatorDefaults,
                        dataFrequency: parseInt(e.target.value) || 1000,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="simCleanSession"
                    checked={localSimulatorDefaults.cleanSession}
                    onChange={(e) =>
                      setLocalSimulatorDefaults({
                        ...localSimulatorDefaults,
                        cleanSession: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded"
                  />
                  <label htmlFor="simCleanSession" className="text-sm text-slate-300">
                    Clean Session
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoReconnect"
                    checked={localSimulatorDefaults.autoReconnect}
                    onChange={(e) =>
                      setLocalSimulatorDefaults({
                        ...localSimulatorDefaults,
                        autoReconnect: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded"
                  />
                  <label htmlFor="autoReconnect" className="text-sm text-slate-300">
                    Auto Reconnect
                  </label>
                </div>
              </div>

              {localSimulatorDefaults.autoReconnect && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Reconnect Delay (ms)
                  </label>
                  <input
                    type="number"
                    value={localSimulatorDefaults.reconnectDelay}
                    onChange={(e) =>
                      setLocalSimulatorDefaults({
                        ...localSimulatorDefaults,
                        reconnectDelay: parseInt(e.target.value) || 5000,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
