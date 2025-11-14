/**
 * SCADA History Service
 * Stores and retrieves metric history in Redis
 */

import { Redis } from 'ioredis';

export interface MetricHistoryPoint {
  timestamp: number;
  value: number | string | boolean;
  datatype: number;
}

export interface MetricHistoryQuery {
  groupId: string;
  edgeNodeId: string;
  deviceId?: string;
  metricName: string;
  start?: number; // Unix timestamp ms
  end?: number;   // Unix timestamp ms
  limit?: number;
}

export class SCADAHistoryService {
  private redis: Redis;
  private readonly TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Save a metric value to history
   */
  async saveMetric(
    groupId: string,
    edgeNodeId: string,
    metricName: string,
    value: number | string | boolean,
    datatype: number,
    deviceId?: string
  ): Promise<void> {
    const key = this.getHistoryKey(groupId, edgeNodeId, metricName, deviceId);
    const timestamp = Date.now();

    const point: MetricHistoryPoint = {
      timestamp,
      value,
      datatype,
    };

    // Store in Redis sorted set with timestamp as score
    await this.redis.zadd(key, timestamp, JSON.stringify(point));

    // Set TTL to auto-expire old data
    await this.redis.expire(key, this.TTL_SECONDS);
  }

  /**
   * Get metric history
   */
  async getHistory(query: MetricHistoryQuery): Promise<MetricHistoryPoint[]> {
    const { groupId, edgeNodeId, metricName, deviceId, start, end, limit } = query;
    const key = this.getHistoryKey(groupId, edgeNodeId, metricName, deviceId);

    const now = Date.now();
    const startTime = start ?? now - 60 * 60 * 1000; // Default: last hour
    const endTime = end ?? now;

    // Get data from sorted set
    const results = await this.redis.zrangebyscore(
      key,
      startTime,
      endTime,
      'LIMIT',
      0,
      limit ?? 1000
    );

    return results.map((item) => JSON.parse(item));
  }

  /**
   * Get latest value for a metric
   */
  async getLatest(
    groupId: string,
    edgeNodeId: string,
    metricName: string,
    deviceId?: string
  ): Promise<MetricHistoryPoint | null> {
    const key = this.getHistoryKey(groupId, edgeNodeId, metricName, deviceId);

    // Get most recent entry
    const results = await this.redis.zrevrange(key, 0, 0);

    if (results.length === 0) {
      return null;
    }

    return JSON.parse(results[0]);
  }

  /**
   * Get all metrics for a node
   */
  async getNodeMetrics(groupId: string, edgeNodeId: string): Promise<string[]> {
    const pattern = `scada:history:${groupId}:${edgeNodeId}:*`;
    const keys = await this.redis.keys(pattern);

    // Extract metric names from keys
    return keys.map((key) => {
      const parts = key.split(':');
      return parts[parts.length - 1];
    });
  }

  /**
   * Delete old data (cleanup)
   */
  async deleteOldData(olderThanMs: number): Promise<number> {
    const pattern = 'scada:history:*';
    const keys = await this.redis.keys(pattern);
    const cutoffTime = Date.now() - olderThanMs;

    let deletedCount = 0;

    for (const key of keys) {
      // Remove entries older than cutoff
      const removed = await this.redis.zremrangebyscore(key, 0, cutoffTime);
      deletedCount += removed;

      // Delete key if empty
      const count = await this.redis.zcard(key);
      if (count === 0) {
        await this.redis.del(key);
      }
    }

    return deletedCount;
  }

  /**
   * Get statistics for a metric (min, max, avg)
   */
  async getStats(
    groupId: string,
    edgeNodeId: string,
    metricName: string,
    start?: number,
    end?: number,
    deviceId?: string
  ): Promise<{
    min: number;
    max: number;
    avg: number;
    count: number;
  } | null> {
    const history = await this.getHistory({
      groupId,
      edgeNodeId,
      metricName,
      deviceId,
      start,
      end,
    });

    if (history.length === 0) {
      return null;
    }

    // Filter numeric values only
    const numericValues = history
      .map((p) => p.value)
      .filter((v): v is number => typeof v === 'number');

    if (numericValues.length === 0) {
      return null;
    }

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const avg = sum / numericValues.length;

    return {
      min,
      max,
      avg,
      count: numericValues.length,
    };
  }

  /**
   * Generate history key
   */
  private getHistoryKey(
    groupId: string,
    edgeNodeId: string,
    metricName: string,
    deviceId?: string
  ): string {
    if (deviceId) {
      return `scada:history:${groupId}:${edgeNodeId}:${deviceId}:${metricName}`;
    }
    return `scada:history:${groupId}:${edgeNodeId}:${metricName}`;
  }
}
