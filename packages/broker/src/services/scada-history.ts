/**
 * SCADA History Service
 * Manages metrics history storage in Redis
 * Sparkplug B Compliant - stores timestamped metric values
 */

import type { Redis } from 'ioredis';
import type { Metric } from '@sparkplug/codec';

export interface MetricHistoryEntry {
  timestamp: string; // ISO 8601
  value: number | string | boolean | bigint;
  datatype: number;
  quality?: number; // Sparkplug quality code
}

export interface MetricHistoryQuery {
  nodeKey: string; // groupId/edgeNodeId
  metricName: string;
  deviceId?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
}

export class SCADAHistoryService {
  private redis: Redis | null;
  private keyPrefix = 'scada:history:';
  private maxPointsPerMetric = 10000; // Per metric history limit

  constructor(redis: Redis | null) {
    this.redis = redis;
  }

  /**
   * Store a metric value in history
   * Key format: scada:history:{groupId}/{edgeNodeId}:{metricName}
   * or:         scada:history:{groupId}/{edgeNodeId}/{deviceId}:{metricName}
   */
  async storeMetricValue(
    groupId: string,
    edgeNodeId: string,
    metricName: string,
    value: number | string | boolean | bigint,
    datatype: number,
    timestamp: bigint,
    deviceId?: string,
    quality?: number
  ): Promise<void> {
    if (!this.redis) return;

    const nodeKey = deviceId
      ? `${groupId}/${edgeNodeId}/${deviceId}`
      : `${groupId}/${edgeNodeId}`;
    const key = `${this.keyPrefix}${nodeKey}:${metricName}`;

    // Convert bigint to string for storage
    const valueStr = typeof value === 'bigint' ? value.toString() : value;

    const entry: MetricHistoryEntry = {
      timestamp: new Date(Number(timestamp)).toISOString(),
      value: valueStr,
      datatype,
      quality,
    };

    try {
      // Use Redis Sorted Set with timestamp as score
      const score = Number(timestamp);
      await this.redis.zadd(key, score, JSON.stringify(entry));

      // Trim to max points (keep most recent)
      const count = await this.redis.zcard(key);
      if (count > this.maxPointsPerMetric) {
        const removeCount = count - this.maxPointsPerMetric;
        await this.redis.zremrangebyrank(key, 0, removeCount - 1);
      }

      // Set TTL on key (30 days)
      await this.redis.expire(key, 30 * 24 * 60 * 60);
    } catch (error) {
      console.error('Failed to store metric history:', error);
    }
  }

  /**
   * Get metric history
   */
  async getMetricHistory(query: MetricHistoryQuery): Promise<MetricHistoryEntry[]> {
    if (!this.redis) return [];

    const key = query.deviceId
      ? `${this.keyPrefix}${query.nodeKey}/${query.deviceId}:${query.metricName}`
      : `${this.keyPrefix}${query.nodeKey}:${query.metricName}`;

    try {
      const startScore = query.startTime ? query.startTime.getTime() : '-inf';
      const endScore = query.endTime ? query.endTime.getTime() : '+inf';

      // Get from sorted set by score range
      const results = await this.redis.zrangebyscore(
        key,
        startScore,
        endScore,
        'LIMIT',
        0,
        query.limit || 1000
      );

      return results.map((r) => JSON.parse(r) as MetricHistoryEntry);
    } catch (error) {
      console.error('Failed to get metric history:', error);
      return [];
    }
  }

  /**
   * Get latest value for a metric
   */
  async getLatestValue(
    groupId: string,
    edgeNodeId: string,
    metricName: string,
    deviceId?: string
  ): Promise<MetricHistoryEntry | null> {
    if (!this.redis) return null;

    const nodeKey = deviceId
      ? `${groupId}/${edgeNodeId}/${deviceId}`
      : `${groupId}/${edgeNodeId}`;
    const key = `${this.keyPrefix}${nodeKey}:${metricName}`;

    try {
      // Get most recent entry
      const results = await this.redis.zrevrange(key, 0, 0);
      if (results.length === 0) return null;

      return JSON.parse(results[0]) as MetricHistoryEntry;
    } catch (error) {
      console.error('Failed to get latest value:', error);
      return null;
    }
  }

  /**
   * Get all metrics for a node
   */
  async getNodeMetrics(groupId: string, edgeNodeId: string): Promise<string[]> {
    if (!this.redis) return [];

    const pattern = `${this.keyPrefix}${groupId}/${edgeNodeId}:*`;

    try {
      const keys = await this.redis.keys(pattern);
      return keys.map((key) => {
        const parts = key.split(':');
        return parts[parts.length - 1];
      });
    } catch (error) {
      console.error('Failed to get node metrics:', error);
      return [];
    }
  }

  /**
   * Delete history for a metric
   */
  async deleteMetricHistory(
    groupId: string,
    edgeNodeId: string,
    metricName: string,
    deviceId?: string
  ): Promise<void> {
    if (!this.redis) return;

    const nodeKey = deviceId
      ? `${groupId}/${edgeNodeId}/${deviceId}`
      : `${groupId}/${edgeNodeId}`;
    const key = `${this.keyPrefix}${nodeKey}:${metricName}`;

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Failed to delete metric history:', error);
    }
  }

  /**
   * Get statistics for a metric
   */
  async getMetricStats(query: MetricHistoryQuery): Promise<{
    count: number;
    min?: number;
    max?: number;
    avg?: number;
    latest?: MetricHistoryEntry;
  }> {
    const history = await this.getMetricHistory(query);

    if (history.length === 0) {
      return { count: 0 };
    }

    const numericValues = history
      .map((e) => Number(e.value))
      .filter((v) => !isNaN(v));

    if (numericValues.length === 0) {
      return { count: history.length, latest: history[history.length - 1] };
    }

    return {
      count: history.length,
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
      latest: history[history.length - 1],
    };
  }

  /**
   * Store NBIRTH/DBIRTH metrics
   */
  async storeBirthMetrics(
    groupId: string,
    edgeNodeId: string,
    metrics: Metric[],
    timestamp: bigint,
    deviceId?: string
  ): Promise<void> {
    if (!metrics) return;

    const promises = metrics.map((metric) => {
      if (!metric.name || metric.name === 'bdSeq') return Promise.resolve();

      // Handle complex types (Uint8Array, DataSet, Template, PropertySet)
      let value: number | string | boolean | bigint;
      if (typeof metric.value === 'number' || typeof metric.value === 'string' ||
          typeof metric.value === 'boolean' || typeof metric.value === 'bigint') {
        value = metric.value;
      } else if (metric.value instanceof Uint8Array) {
        // Convert Uint8Array to hex string
        value = Buffer.from(metric.value).toString('hex');
      } else if (metric.value !== null && metric.value !== undefined) {
        // Convert complex objects to JSON string
        value = JSON.stringify(metric.value);
      } else {
        // Skip null/undefined values
        return Promise.resolve();
      }

      return this.storeMetricValue(
        groupId,
        edgeNodeId,
        metric.name,
        value,
        metric.datatype ?? 0,
        metric.timestamp || timestamp,
        deviceId
      );
    });

    await Promise.all(promises);
  }

  /**
   * Store NDATA/DDATA metrics
   */
  async storeDataMetrics(
    groupId: string,
    edgeNodeId: string,
    metrics: Metric[],
    timestamp: bigint,
    deviceId?: string
  ): Promise<void> {
    return this.storeBirthMetrics(groupId, edgeNodeId, metrics, timestamp, deviceId);
  }
}
