/**
 * Simulator Controls Component
 * Top bar with action buttons and statistics
 */

import { useSimulatorStore } from '../../stores/simulatorStore';

interface SimulatorControlsProps {
  onAddNode?: () => void;
  onLoadTemplate?: () => void;
  onExportConfig?: () => void;
  onImportConfig?: () => void;
}

export function SimulatorControls({
  onAddNode,
  onLoadTemplate,
  onExportConfig,
  onImportConfig,
}: SimulatorControlsProps) {
  const {
    isRunning,
    speed,
    stats,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    resumeSimulation,
    setSpeed,
    resetSimulation,
  } = useSimulatorStore();

  const speedOptions = [1, 2, 5, 10, 100];

  const handleStartStop = () => {
    if (isRunning) {
      pauseSimulation();
    } else {
      if (stats.uptime > 0) {
        resumeSimulation();
      } else {
        startSimulation();
      }
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Start/Pause/Resume Button */}
          <button
            onClick={handleStartStop}
            disabled={stats.totalNodes === 0}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
              ${
                isRunning
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isRunning ? 'Pause' : stats.uptime > 0 ? 'Resume' : 'Start'}
          </button>

          {/* Stop Button */}
          <button
            onClick={stopSimulation}
            disabled={!isRunning && stats.uptime === 0}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop
          </button>

          {/* Reset Button */}
          <button
            onClick={resetSimulation}
            disabled={stats.uptime === 0}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-700 mx-2" />

          {/* Add Node Button */}
          <button
            onClick={onAddNode}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            + Add Node
          </button>

          {/* Load Template Button */}
          <button
            onClick={onLoadTemplate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Templates
          </button>
        </div>

        {/* Center: Speed Control */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-400">Speed:</span>
          <div className="flex gap-1">
            {speedOptions.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`
                  px-3 py-1.5 rounded text-sm font-medium transition-colors
                  ${
                    speed === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }
                `}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Statistics */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-500">Nodes</p>
            <p className="text-lg font-bold text-white">
              <span className="text-emerald-500">{stats.runningNodes}</span>
              <span className="text-slate-600">/</span>
              {stats.totalNodes}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500">Devices</p>
            <p className="text-lg font-bold text-white">{stats.totalDevices}</p>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500">Messages</p>
            <p className="text-lg font-bold text-white">{stats.messagesPublished}</p>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500">Msg/Sec</p>
            <p className="text-lg font-bold text-blue-500">
              {stats.messagesPerSecond.toFixed(1)}
            </p>
          </div>

          {stats.uptime > 0 && (
            <div className="text-center">
              <p className="text-xs text-slate-500">Uptime</p>
              <p className="text-lg font-bold text-white">{Math.floor(stats.uptime)}s</p>
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-8 bg-slate-700 mx-2" />

          {/* Export/Import */}
          <div className="flex gap-1">
            <button
              onClick={onExportConfig}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
              title="Export configuration"
            >
              Export
            </button>
            <button
              onClick={onImportConfig}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
              title="Import configuration"
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
