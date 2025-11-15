/**
 * SCADA History API Service
 * Fetches metric history from backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface MetricHistoryEntry {
  timestamp: string; // ISO 8601
  value: number | string | boolean | bigint;
  datatype: number;
  quality?: number;
}

export interface MetricStats {
  count: number;
  min?: number;
  max?: number;
  avg?: number;
  first?: MetricHistoryEntry;
  latest?: MetricHistoryEntry;
}

export interface HistoryQuery {
  groupId: string;
  edgeNodeId: string;
  metricName: string;
  deviceId?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
}

/**
 * Fetch metric history
 */
export async function fetchMetricHistory(
  query: HistoryQuery
): Promise<MetricHistoryEntry[]> {
  const params = new URLSearchParams({
    groupId: query.groupId,
    edgeNodeId: query.edgeNodeId,
    metricName: query.metricName,
  });

  if (query.deviceId) params.append('deviceId', query.deviceId);
  if (query.startTime) params.append('startTime', query.startTime.toISOString());
  if (query.endTime) params.append('endTime', query.endTime.toISOString());
  if (query.limit) params.append('limit', query.limit.toString());

  const response = await fetch(`${API_BASE_URL}/api/history/metrics?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch metric history: ${response.statusText}`);
  }

  const data = await response.json();
  return data.history || [];
}

/**
 * Fetch latest metric value
 */
export async function fetchLatestMetricValue(
  groupId: string,
  edgeNodeId: string,
  metricName: string,
  deviceId?: string
): Promise<MetricHistoryEntry | null> {
  const params = new URLSearchParams();
  if (deviceId) params.append('deviceId', deviceId);

  const response = await fetch(
    `${API_BASE_URL}/api/history/metrics/${groupId}/${edgeNodeId}/${metricName}/latest?${params}`
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch latest metric value: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch metric statistics
 */
export async function fetchMetricStats(
  query: HistoryQuery
): Promise<MetricStats> {
  const params = new URLSearchParams({
    groupId: query.groupId,
    edgeNodeId: query.edgeNodeId,
    metricName: query.metricName,
  });

  if (query.deviceId) params.append('deviceId', query.deviceId);
  if (query.startTime) params.append('startTime', query.startTime.toISOString());
  if (query.endTime) params.append('endTime', query.endTime.toISOString());

  const response = await fetch(`${API_BASE_URL}/api/history/stats?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch metric stats: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch all metrics for a node
 */
export async function fetchNodeMetrics(
  groupId: string,
  edgeNodeId: string
): Promise<string[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/history/node/${groupId}/${edgeNodeId}/metrics`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch node metrics: ${response.statusText}`);
  }

  const data = await response.json();
  return data.metrics || [];
}

/**
 * Delete metric history
 */
export async function deleteMetricHistory(
  groupId: string,
  edgeNodeId: string,
  metricName: string,
  deviceId?: string
): Promise<void> {
  const params = new URLSearchParams({
    groupId,
    edgeNodeId,
    metricName,
  });

  if (deviceId) params.append('deviceId', deviceId);

  const response = await fetch(`${API_BASE_URL}/api/history/metrics?${params}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete metric history: ${response.statusText}`);
  }
}
