/**
 * SCADA API Routes
 * REST endpoints for SCADA data and history
 */

import type { FastifyInstance } from 'fastify';
import type { SCADAHistoryService } from '../services/scada-history.js';

export interface SCADARoutesOptions {
  historyService?: SCADAHistoryService;
}

export async function registerSCADARoutes(
  fastify: FastifyInstance,
  options: SCADARoutesOptions
) {
  const { historyService } = options;

  // Get metric history
  fastify.get<{
    Params: { groupId: string; edgeNodeId: string; metricName: string };
    Querystring: { start?: string; end?: string; limit?: string; deviceId?: string };
  }>('/api/scada/history/:groupId/:edgeNodeId/:metricName', async (request) => {
    const { groupId, edgeNodeId, metricName } = request.params;
    const { start, end, limit, deviceId } = request.query;

    if (!historyService) {
      return {
        error: 'History service not available',
        data: [],
      };
    }

    const history = await historyService.getHistory({
      groupId,
      edgeNodeId,
      metricName,
      deviceId,
      start: start ? parseInt(start) : undefined,
      end: end ? parseInt(end) : undefined,
      limit: limit ? parseInt(limit) : 1000,
    });

    return {
      groupId,
      edgeNodeId,
      metricName,
      deviceId,
      data: history,
    };
  });

  // Get metric statistics
  fastify.get<{
    Params: { groupId: string; edgeNodeId: string; metricName: string };
    Querystring: { start?: string; end?: string; deviceId?: string };
  }>('/api/scada/stats/:groupId/:edgeNodeId/:metricName', async (request) => {
    const { groupId, edgeNodeId, metricName } = request.params;
    const { start, end, deviceId } = request.query;

    if (!historyService) {
      return {
        error: 'History service not available',
      };
    }

    const stats = await historyService.getStats(
      groupId,
      edgeNodeId,
      metricName,
      start ? parseInt(start) : undefined,
      end ? parseInt(end) : undefined,
      deviceId
    );

    return {
      groupId,
      edgeNodeId,
      metricName,
      deviceId,
      stats,
    };
  });

  // Get all metrics for a node
  fastify.get<{
    Params: { groupId: string; edgeNodeId: string };
  }>('/api/scada/metrics/:groupId/:edgeNodeId', async (request) => {
    const { groupId, edgeNodeId } = request.params;

    if (!historyService) {
      return {
        error: 'History service not available',
        metrics: [],
      };
    }

    const metrics = await historyService.getNodeMetrics(groupId, edgeNodeId);

    return {
      groupId,
      edgeNodeId,
      metrics,
    };
  });

  // Export metric data
  fastify.post<{
    Body: {
      groupId: string;
      edgeNodeId: string;
      metrics: string[];
      start?: number;
      end?: number;
      format: 'csv' | 'json';
      deviceId?: string;
    };
  }>('/api/scada/export', async (request, reply) => {
    const { groupId, edgeNodeId, metrics, start, end, format, deviceId } = request.body;

    if (!historyService) {
      return { error: 'History service not available' };
    }

    if (format === 'csv') {
      // Generate CSV
      const lines: string[] = ['timestamp,metric,value,datatype'];

      for (const metricName of metrics) {
        const history = await historyService.getHistory({
          groupId,
          edgeNodeId,
          metricName,
          deviceId,
          start,
          end,
        });

        for (const point of history) {
          lines.push(
            `${point.timestamp},${metricName},${point.value},${point.datatype}`
          );
        }
      }

      reply.header('Content-Type', 'text/csv');
      reply.header(
        'Content-Disposition',
        `attachment; filename="scada-${groupId}-${edgeNodeId}-${Date.now()}.csv"`
      );

      return lines.join('\n');
    } else {
      // JSON format
      const data: any = {};

      for (const metricName of metrics) {
        const history = await historyService.getHistory({
          groupId,
          edgeNodeId,
          metricName,
          deviceId,
          start,
          end,
        });

        data[metricName] = history;
      }

      reply.header('Content-Type', 'application/json');
      return {
        groupId,
        edgeNodeId,
        deviceId,
        metrics,
        data,
      };
    }
  });

  // Get latest value for a metric
  fastify.get<{
    Params: { groupId: string; edgeNodeId: string; metricName: string };
    Querystring: { deviceId?: string };
  }>('/api/scada/latest/:groupId/:edgeNodeId/:metricName', async (request) => {
    const { groupId, edgeNodeId, metricName } = request.params;
    const { deviceId } = request.query;

    if (!historyService) {
      return {
        error: 'History service not available',
      };
    }

    const latest = await historyService.getLatest(
      groupId,
      edgeNodeId,
      metricName,
      deviceId
    );

    return {
      groupId,
      edgeNodeId,
      metricName,
      deviceId,
      latest,
    };
  });
}
