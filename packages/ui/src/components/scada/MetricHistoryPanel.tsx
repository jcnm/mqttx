/**
 * Metric History Panel
 * Fetches and displays metric history from backend
 */

import { useEffect, useState } from 'react';
import { MetricHistoryChart } from './MetricHistoryChart';
import { fetchMetricHistory, fetchMetricStats } from '../../services/historyApi';
import type { MetricHistoryEntry, MetricStats } from '../../services/historyApi';

interface MetricHistoryPanelProps {
  groupId: string;
  edgeNodeId: string;
  metricNames: string[]; // Can show multiple metrics
  deviceId?: string;
  timeRange?: number; // In minutes (default: 60)
  refreshInterval?: number; // In milliseconds (default: 10000)
}

interface MetricHistoryPoint {
  timestamp: number;
  value: number;
  name: string;
}

export function MetricHistoryPanel({
  groupId,
  edgeNodeId,
  metricNames,
  deviceId,
  timeRange = 60,
  refreshInterval = 10000,
}: MetricHistoryPanelProps) {
  const [data, setData] = useState<MetricHistoryPoint[]>([]);
  const [stats, setStats] = useState<Record<string, MetricStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(timeRange);

  const fetchData = async () => {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - selectedRange * 60 * 1000);

      const allData: MetricHistoryPoint[] = [];
      const allStats: Record<string, MetricStats> = {};

      // Fetch data for each metric
      await Promise.all(
        metricNames.map(async (metricName) => {
          try {
            // Fetch history
            const history = await fetchMetricHistory({
              groupId,
              edgeNodeId,
              metricName,
              deviceId,
              startTime,
              endTime,
              limit: 1000,
            });

            // Fetch stats
            const statsData = await fetchMetricStats({
              groupId,
              edgeNodeId,
              metricName,
              deviceId,
              startTime,
              endTime,
            });

            allStats[metricName] = statsData;

            // Convert to chart format
            history.forEach((entry: MetricHistoryEntry) => {
              // Only handle numeric values for charts
              const numValue =
                typeof entry.value === 'number'
                  ? entry.value
                  : typeof entry.value === 'bigint'
                  ? Number(entry.value)
                  : parseFloat(String(entry.value));

              if (!isNaN(numValue)) {
                allData.push({
                  timestamp: new Date(entry.timestamp).getTime(),
                  value: numValue,
                  name: metricName,
                });
              }
            });
          } catch (err) {
            console.error(`Failed to fetch data for ${metricName}:`, err);
          }
        })
      );

      setData(allData);
      setStats(allStats);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch metric history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [groupId, edgeNodeId, metricNames, deviceId, selectedRange, refreshInterval]);

  const timeRangeOptions = [
    { label: '15min', value: 15 },
    { label: '1hr', value: 60 },
    { label: '6hr', value: 360 },
    { label: '24hr', value: 1440 },
    { label: '7d', value: 10080 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900 rounded-lg border border-slate-800">
        <div className="text-slate-400">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-900 rounded-lg border border-red-500">
        <div className="text-red-400 mb-2">Error: {error}</div>
        <button
          onClick={fetchData}
          className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Metric History</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Time Range:</span>
          <div className="flex gap-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedRange(option.value)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  selectedRange === option.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary for all metrics */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(stats).map(([metricName, metricStats]) => (
            <div
              key={metricName}
              className="bg-slate-900 rounded-lg p-3 border border-slate-800"
            >
              <h4 className="text-xs font-semibold text-white mb-2">{metricName}</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                {metricStats.min !== undefined && (
                  <div>
                    <p className="text-[10px] text-slate-400">Min</p>
                    <p className="text-sm font-bold text-blue-400">
                      {metricStats.min.toFixed(2)}
                    </p>
                  </div>
                )}
                {metricStats.avg !== undefined && (
                  <div>
                    <p className="text-[10px] text-slate-400">Avg</p>
                    <p className="text-sm font-bold text-purple-400">
                      {metricStats.avg.toFixed(2)}
                    </p>
                  </div>
                )}
                {metricStats.max !== undefined && (
                  <div>
                    <p className="text-[10px] text-slate-400">Max</p>
                    <p className="text-sm font-bold text-emerald-400">
                      {metricStats.max.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <MetricHistoryChart
        data={data}
        metricNames={metricNames}
        height={400}
        showBrush={data.length > 20}
      />

      {/* Auto-refresh indicator */}
      <div className="text-xs text-slate-400 text-center">
        Auto-refreshing every {refreshInterval / 1000}s
      </div>
    </div>
  );
}
