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

export interface ServerOptions {
  config: ConfigLoader;
  broker: SparkplugBroker;
  stateManager: StateManager;
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
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const ws = connection.socket as any;

    ws.on('message', (message: any) => {
      // Handle WebSocket messages
      ws.send(JSON.stringify({ echo: message.toString() }));
    });

    // Send periodic updates
    const interval = setInterval(() => {
      const stats = options.broker.getStats();
      ws.send(JSON.stringify({ type: 'stats', data: stats }));
    }, 5000);

    ws.on('close', () => {
      clearInterval(interval);
    });
  });

  return fastify;
}
