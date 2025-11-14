/**
 * Alarm Panel Component
 * Displays active alarms and alarm history
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { alarmManager, AlarmSeverity, AlarmState } from '../../services/alarmSystem';
import type { Alarm, AlarmThreshold } from '../../services/alarmSystem';

export function AlarmPanel() {
  const [activeAlarms, setActiveAlarms] = useState<Alarm[]>([]);
  const [alarmHistory, setAlarmHistory] = useState<Alarm[]>([]);
  const [thresholds, setThresholds] = useState<AlarmThreshold[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Initial load
    setActiveAlarms(alarmManager.getActiveAlarms());
    setAlarmHistory(alarmManager.getAlarmHistory());
    setThresholds(alarmManager.getThresholds());

    // Subscribe to alarm events
    const unsubscribe = alarmManager.subscribe(() => {
      setActiveAlarms(alarmManager.getActiveAlarms());
      setAlarmHistory(alarmManager.getAlarmHistory());
    });

    return unsubscribe;
  }, []);

  const handleAcknowledge = (alarmId: string) => {
    alarmManager.acknowledgeAlarm(alarmId, 'SCADA User');
    setActiveAlarms(alarmManager.getActiveAlarms());
  };

  const handleClearAll = () => {
    alarmManager.clearAllAlarms();
    setActiveAlarms([]);
  };

  const getSeverityColor = (severity: AlarmSeverity) => {
    switch (severity) {
      case AlarmSeverity.CRITICAL:
        return 'bg-red-500 border-red-600';
      case AlarmSeverity.WARNING:
        return 'bg-amber-500 border-amber-600';
      case AlarmSeverity.INFO:
        return 'bg-blue-500 border-blue-600';
    }
  };

  const getSeverityIcon = (severity: AlarmSeverity) => {
    switch (severity) {
      case AlarmSeverity.CRITICAL:
        return '🚨';
      case AlarmSeverity.WARNING:
        return '⚠️';
      case AlarmSeverity.INFO:
        return 'ℹ️';
    }
  };

  const alarmCounts = alarmManager.getAlarmCounts();

  return (
    <div className="space-y-4">
      {/* Header with Alarm Counts */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Alarms</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-1 text-xs font-medium text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            >
              {showSettings ? 'Hide Settings' : 'Settings'}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1 text-xs font-medium text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            >
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>
        </div>

        {/* Alarm Counts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{alarmCounts.critical}</p>
            <p className="text-xs text-red-300">Critical</p>
          </div>
          <div className="bg-amber-900/30 border border-amber-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{alarmCounts.warning}</p>
            <p className="text-xs text-amber-300">Warning</p>
          </div>
          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{alarmCounts.info}</p>
            <p className="text-xs text-blue-300">Info</p>
          </div>
        </div>
      </div>

      {/* Active Alarms */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white">
            Active Alarms ({activeAlarms.length})
          </h4>
          {activeAlarms.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {activeAlarms.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">✅</div>
            <p>No active alarms</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`border rounded-lg p-3 ${getSeverityColor(alarm.severity)}/10 ${
                  alarm.state === AlarmState.ACKNOWLEDGED
                    ? 'opacity-60'
                    : 'border-l-4 animate-pulse'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getSeverityIcon(alarm.severity)}</span>
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded ${getSeverityColor(
                          alarm.severity
                        )} text-white`}
                      >
                        {alarm.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(alarm.triggeredAt, 'HH:mm:ss')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{alarm.message}</p>
                    <p className="text-xs text-slate-400">
                      {alarm.nodeKey} • {alarm.metricName}: {alarm.value.toFixed(2)} (threshold:{' '}
                      {alarm.threshold})
                    </p>
                    {alarm.state === AlarmState.ACKNOWLEDGED && (
                      <p className="text-xs text-emerald-400 mt-1">
                        ✓ Acknowledged by {alarm.acknowledgedBy} at{' '}
                        {alarm.acknowledgedAt && format(alarm.acknowledgedAt, 'HH:mm:ss')}
                      </p>
                    )}
                  </div>
                  {alarm.state === AlarmState.ACTIVE && (
                    <button
                      onClick={() => handleAcknowledge(alarm.id)}
                      className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alarm History */}
      {showHistory && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <h4 className="text-sm font-semibold text-white mb-3">
            Alarm History ({alarmHistory.length})
          </h4>
          {alarmHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No alarm history</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alarmHistory.map((alarm) => (
                <div
                  key={alarm.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{getSeverityIcon(alarm.severity)}</span>
                    <span className="text-xs text-slate-400">
                      {format(alarm.triggeredAt, 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                    {alarm.state === AlarmState.CLEARED && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-700 text-white rounded">
                        CLEARED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white">{alarm.message}</p>
                  <p className="text-xs text-slate-400">
                    {alarm.nodeKey} • {alarm.metricName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alarm Settings */}
      {showSettings && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <h4 className="text-sm font-semibold text-white mb-3">
            Alarm Thresholds ({thresholds.length})
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Configure alarm thresholds for metrics. Coming soon: UI to add/edit thresholds.
          </p>
          <div className="space-y-2">
            {thresholds.map((threshold) => (
              <div
                key={threshold.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {threshold.metricName} {threshold.condition} {threshold.value}
                    </p>
                    <p className="text-xs text-slate-400">{threshold.message}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded ${getSeverityColor(
                      threshold.severity
                    )} text-white`}
                  >
                    {threshold.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
