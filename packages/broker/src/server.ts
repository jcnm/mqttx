// Fastify REST API Server
// Provides REST API for broker management and monitoring

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { ConfigLoader } from './config/loader.js';
import { StateManager } from '@sparkplug/state';
import { SparkplugBroker } from './mqtt/broker.js';
import { SCADAHistoryService } from './services/scada-history.js';
import { HistoryListener } from './services/history-listener.js';
import type { Redis } from 'ioredis';

export interface ServerOptions {
  config: ConfigLoader;
  broker: SparkplugBroker;
  stateManager: StateManager;
  redis?: Redis | null;
}

export async function createServer(options: ServerOptions) {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(websocket);

  // Initialize SCADA History Service
  const historyService = new SCADAHistoryService(options.redis || null);

  // Attach history listener to broker (auto-store metrics)
  if (options.redis) {
    const historyListener = new HistoryListener(historyService);
    historyListener.attach(options.broker.getAedes());
    console.log('✅ SCADA history listener attached');
  }

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: Date.now() };
  });

  // Broker stats
  fastify.get('/api/broker/stats', async () => {
    return options.broker.getStats();
  });

  // Get all sessions
  fastify.get('/api/broker/sessions', async () => {
    return options.broker.getMonitor().getSessions();
  });

  // Get specific session
  fastify.get<{
    Params: { clientId: string };
  }>('/api/broker/sessions/:clientId', async (request) => {
    const { clientId } = request.params;
    const session = options.broker.getMonitor().getSession(clientId);
    if (!session) {
      return { error: 'Session not found' };
    }
    return session;
  });

  // Get broker logs
  fastify.get<{
    Querystring: { limit?: string };
  }>('/api/broker/logs', async (request) => {
    const limit = request.query.limit ? parseInt(request.query.limit) : undefined;
    return options.broker.getMonitor().getLogs(limit);
  });

  // Clear broker logs
  fastify.delete('/api/broker/logs', async () => {
    options.broker.getMonitor().clearLogs();
    return { success: true };
  });

  // Get all nodes
  fastify.get('/api/nodes', async () => {
    return options.stateManager.getAllNodes();
  });

  // Get all online nodes
  fastify.get('/api/nodes/online', async () => {
    return options.stateManager.getOnlineNodes();
  });

  // Get specific node
  fastify.get<{
    Params: { groupId: string; edgeNodeId: string };
  }>('/api/nodes/:groupId/:edgeNodeId', async (request) => {
    const { groupId, edgeNodeId } = request.params;
    const node = options.stateManager.getNode(groupId, edgeNodeId);

    if (!node) {
      return { error: 'Node not found' };
    }

    return node;
  });

  // Get all devices
  fastify.get('/api/devices', async () => {
    return options.stateManager.getAllDevices();
  });

  // Get devices for a specific node
  fastify.get<{
    Params: { groupId: string; edgeNodeId: string };
  }>('/api/devices/:groupId/:edgeNodeId', async (request) => {
    const { groupId, edgeNodeId } = request.params;
    return options.stateManager.getDevicesForNode(groupId, edgeNodeId);
  });

  // Send NCMD (Node Command)
  fastify.post<{
    Body: {
      groupId: string;
      edgeNodeId: string;
      metrics: any[];
    };
  }>('/api/command/node', async (request, reply) => {
    const { groupId, edgeNodeId, metrics } = request.body;

    // This would publish an NCMD message
    reply.send({ success: true, message: 'Command sent' });
  });

  // Send DCMD (Device Command)
  fastify.post<{
    Body: {
      groupId: string;
      edgeNodeId: string;
      deviceId: string;
      metrics: any[];
    };
  }>('/api/command/device', async (request, reply) => {
    const { groupId, edgeNodeId, deviceId, metrics } = request.body;

    // This would publish a DCMD message
    reply.send({ success: true, message: 'Command sent' });
  });

  // Request node rebirth
  fastify.post<{
    Body: {
      groupId: string;
      edgeNodeId: string;
    };
  }>('/api/rebirth', async (request, reply) => {
    const { groupId, edgeNodeId } = request.body;

    // This would send rebirth command
    reply.send({ success: true, message: 'Rebirth requested' });
  });

  // ===== SCADA History Endpoints =====

  // Get metric history
  fastify.get<{
    Querystring: {
      groupId: string;
      edgeNodeId: string;
      metricName: string;
      deviceId?: string;
      startTime?: string;
      endTime?: string;
      limit?: string;
    };
  }>('/api/history/metrics', async (request) => {
    const { groupId, edgeNodeId, metricName, deviceId, startTime, endTime, limit } = request.query;

    const nodeKey = `${groupId}/${edgeNodeId}`;

    const history = await historyService.getMetricHistory({
      nodeKey,
      metricName,
      deviceId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return { history };
  });

  // Get latest metric value
  fastify.get<{
    Params: {
      groupId: string;
      edgeNodeId: string;
      metricName: string;
    };
    Querystring: {
      deviceId?: string;
    };
  }>('/api/history/metrics/:groupId/:edgeNodeId/:metricName/latest', async (request) => {
    const { groupId, edgeNodeId, metricName } = request.params;
    const { deviceId } = request.query;

    const latest = await historyService.getLatestValue(groupId, edgeNodeId, metricName, deviceId);

    if (!latest) {
      return { error: 'No data found' };
    }

    return latest;
  });

  // Get metric statistics
  fastify.get<{
    Querystring: {
      groupId: string;
      edgeNodeId: string;
      metricName: string;
      deviceId?: string;
      startTime?: string;
      endTime?: string;
    };
  }>('/api/history/stats', async (request) => {
    const { groupId, edgeNodeId, metricName, deviceId, startTime, endTime } = request.query;

    const nodeKey = `${groupId}/${edgeNodeId}`;

    const stats = await historyService.getMetricStats({
      nodeKey,
      metricName,
      deviceId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });

    return stats;
  });

  // Get all metrics for a node
  fastify.get<{
    Params: {
      groupId: string;
      edgeNodeId: string;
    };
  }>('/api/history/node/:groupId/:edgeNodeId/metrics', async (request) => {
    const { groupId, edgeNodeId } = request.params;

    const metrics = await historyService.getNodeMetrics(groupId, edgeNodeId);

    return { metrics };
  });

  // Delete metric history
  fastify.delete<{
    Querystring: {
      groupId: string;
      edgeNodeId: string;
      metricName: string;
      deviceId?: string;
    };
  }>('/api/history/metrics', async (request) => {
    const { groupId, edgeNodeId, metricName, deviceId } = request.query;

    await historyService.deleteMetricHistory(groupId, edgeNodeId, metricName, deviceId);

    return { success: true };
  });

  // WebSocket for real-time updates
  fastify.get('/ws', { websocket: true }, (connection: any, req) => {
    const ws = connection.socket;
    const monitor = options.broker.getMonitor();

    // Send initial data
    ws.send(JSON.stringify({
      type: 'initial',
      data: {
        stats: monitor.getStats(),
        sessions: monitor.getSessions(),
        logs: monitor.getLogs(100),
      },
    }));

    // Listen for new logs
    const logHandler = (log: any) => {
      ws.send(JSON.stringify({ type: 'log', data: log }));
    };

    // Listen for client events
    const clientConnectHandler = (session: any) => {
      ws.send(JSON.stringify({ type: 'clientConnect', data: session }));
    };

    const clientDisconnectHandler = (session: any) => {
      ws.send(JSON.stringify({ type: 'clientDisconnect', data: session }));
    };

    const sessionStaleHandler = (session: any) => {
      ws.send(JSON.stringify({ type: 'sessionStale', data: session }));
    };

    monitor.on('log', logHandler);
    monitor.on('clientConnect', clientConnectHandler);
    monitor.on('clientDisconnect', clientDisconnectHandler);
    monitor.on('sessionStale', sessionStaleHandler);

    ws.on('message', (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        // Ignore invalid messages
      }
    });

    // Send periodic stats updates
    const interval = setInterval(() => {
      const stats = monitor.getStats();
      ws.send(JSON.stringify({ type: 'stats', data: stats }));
    }, 5000);

    ws.on('close', () => {
      clearInterval(interval);
      monitor.off('log', logHandler);
      monitor.off('clientConnect', clientConnectHandler);
      monitor.off('clientDisconnect', clientDisconnectHandler);
      monitor.off('sessionStale', sessionStaleHandler);
    });
  });

  return fastify;
}
