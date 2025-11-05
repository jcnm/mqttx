/**
 * Metric History Chart Component
 * Line chart showing metric value over time using Recharts
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { format } from 'date-fns';

interface MetricHistoryPoint {
  timestamp: number;
  value: number;
  name: string;
}

interface MetricHistoryChartProps {
  data: MetricHistoryPoint[];
  metricNames?: string[];
  height?: number;
  showBrush?: boolean;
}

export function MetricHistoryChart({
  data,
  metricNames,
  height = 400,
  showBrush = true,
}: MetricHistoryChartProps) {
  // Colors for different metrics
  const colors = [
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // purple-500
    '#06b6d4', // cyan-500
    '#ec4899', // pink-500
  ];

  // Get unique metric names from data if not provided
  const metricList = useMemo(() => {
    if (metricNames && metricNames.length > 0) {
      return metricNames;
    }
    const names = new Set<string>();
    data.forEach((point) => names.add(point.name));
    return Array.from(names);
  }, [data, metricNames]);

  // Transform data for Recharts (group by timestamp)
  const chartData = useMemo(() => {
    const grouped = new Map<number, Record<string, number>>();

    data.forEach((point) => {
      if (!grouped.has(point.timestamp)) {
        grouped.set(point.timestamp, { timestamp: point.timestamp });
      }
      grouped.get(point.timestamp)![point.name] = point.value;
    });

    return Array.from(grouped.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-slate-400 mb-2">
            {format(new Date(label), 'MMM dd, yyyy HH:mm:ss')}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300">{entry.name}:</span>
              <span className="font-semibold text-white">
                {typeof entry.value === 'number'
                  ? entry.value.toFixed(2)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Handle export
  const handleExport = () => {
    const csv = [
      ['Timestamp', ...metricList].join(','),
      ...chartData.map((row) =>
        [
          format(new Date(row.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          ...metricList.map((name) => row[name] ?? ''),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metric-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Empty state
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900 rounded-lg border border-slate-800">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-slate-400">No historical data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">
          Metric History ({chartData.length} data points)
        </h4>
        <button
          onClick={handleExport}
          className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Chart */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => format(new Date(value), 'HH:mm:ss')}
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
              formatter={(value) => (
                <span className="text-slate-300">{value}</span>
              )}
            />

            {metricList.map((name, index) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}

            {showBrush && chartData.length > 10 && (
              <Brush
                dataKey="timestamp"
                height={30}
                stroke="#10b981"
                fill="#1e293b"
                tickFormatter={(value) => format(new Date(value), 'HH:mm')}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-lg p-2 border border-slate-800 text-center">
          <p className="text-xs text-slate-400">Data Points</p>
          <p className="text-sm font-bold text-white">{chartData.length}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-2 border border-slate-800 text-center">
          <p className="text-xs text-slate-400">Metrics</p>
          <p className="text-sm font-bold text-white">{metricList.length}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-2 border border-slate-800 text-center">
          <p className="text-xs text-slate-400">Time Range</p>
          <p className="text-sm font-bold text-white">
            {chartData.length > 1
              ? `${Math.round(
                  (chartData[chartData.length - 1].timestamp - chartData[0].timestamp) /
                    1000
                )}s`
              : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini Sparkline Chart
 * Compact version for inline display
 */
interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function MiniSparkline({
  data,
  color = '#10b981',
  height = 30,
}: MiniSparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  if (data.length === 0) {
    return <div className="h-8 bg-slate-800 rounded" />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
