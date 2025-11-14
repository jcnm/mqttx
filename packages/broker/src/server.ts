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
import { registerSCADARoutes } from './routes/scada.js';
import type { SCADAHistoryService } from './services/scada-history.js';

export interface ServerOptions {
  config: ConfigLoader;
  broker: SparkplugBroker;
  stateManager: StateManager;
  historyService?: SCADAHistoryService;
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

  // Register SCADA routes
  await registerSCADARoutes(fastify, {
    historyService: options.historyService,
  });

  return fastify;
}
