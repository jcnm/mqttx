/**
 * Command Panel Component
 * Send commands to devices and EoN nodes with scheduling
 */

import { useCommandStore } from '../../stores/commandStore';
import { format } from 'date-fns';

export function CommandPanel() {
  const { commands, templates, history } = useCommandStore();

  const commandsArray = Array.from(commands.values());
  const pendingCommands = commandsArray.filter((c) => c.status === 'pending');
  const recentCommands = commandsArray.slice(-5).reverse();

  return (
    <div className="h-full bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Command Panel</h2>
          <p className="text-slate-400">
            Send commands to devices and EoN nodes with scheduling
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">{pendingCommands.length}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm">Total Sent</p>
            <p className="text-2xl font-bold text-white">{history.totalSent}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm">Acknowledged</p>
            <p className="text-2xl font-bold text-emerald-500">{history.totalAcknowledged}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <p className="text-slate-400 text-sm">Failed</p>
            <p className="text-2xl font-bold text-red-500">{history.totalFailed}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Command Builder */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create Command</h3>

            <div className="space-y-4">
              {/* Command Type */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Command Type
                </label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white">
                  <option>NCMD - Node Command</option>
                  <option>DCMD - Device Command</option>
                  <option>REBIRTH - Rebirth Request</option>
                  <option>CUSTOM - Custom Message</option>
                </select>
              </div>

              {/* Target */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Target
                </label>
                <input
                  type="text"
                  placeholder="Group ID / Edge Node ID"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Schedule
                </label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white">
                  <option>Immediate</option>
                  <option>At Specific Time</option>
                  <option>Recurring (Cron)</option>
                  <option>Conditional</option>
                </select>
              </div>

              <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
                Create Command
              </button>
            </div>

            {/* Templates */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-400 mb-3">Quick Templates</h4>
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    className="w-full text-left px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:border-emerald-600 transition-colors"
                  >
                    <div className="font-medium text-white">{template.name}</div>
                    <div className="text-xs text-slate-400">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Commands */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Commands</h3>

            {recentCommands.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📡</div>
                <p className="text-slate-400">No commands yet</p>
                <p className="text-sm text-slate-500 mt-2">
                  Create your first command to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCommands.map((cmd) => (
                  <div
                    key={cmd.id}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-white">{cmd.type}</div>
                        <div className="text-xs text-slate-400">
                          {cmd.target.groupId}/{cmd.target.edgeNodeId}
                          {cmd.target.deviceId && `/${cmd.target.deviceId}`}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          cmd.status === 'sent'
                            ? 'bg-blue-900/50 text-blue-400'
                            : cmd.status === 'acknowledged'
                            ? 'bg-emerald-900/50 text-emerald-400'
                            : cmd.status === 'failed'
                            ? 'bg-red-900/50 text-red-400'
                            : 'bg-yellow-900/50 text-yellow-400'
                        }`}
                      >
                        {cmd.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(cmd.createdAt, 'MMM dd, HH:mm:ss')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Phase 5 Notice */}
        <div className="mt-6 bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h4 className="font-semibold text-blue-400 mb-1">Phase 1 Complete</h4>
              <p className="text-sm text-slate-400">
                Command panel structure and templates are ready. Full command builder, target
                selector, scheduling engine, and history viewer will be implemented in Phase 5.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
