/**
 * Simulations API Routes
 * RESTful API for managing simulation persistence
 * Supports Redis and File backends
 */

import type { FastifyInstance } from 'fastify';
import type { Redis } from 'ioredis';
import fs from 'fs/promises';
import path from 'path';

const REDIS_PREFIX = 'simulation:';
const FILE_DIR = './data/simulations';

interface SimulationSnapshot {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastModified: number;
  version: string;
  nodes: any[];
}

interface SimulationMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastModified: number;
  nodeCount: number;
  deviceCount: number;
}

export async function registerSimulationRoutes(
  fastify: FastifyInstance,
  redis: Redis | null
) {
  // Ensure file directory exists
  try {
    await fs.mkdir(FILE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create simulations directory:', error);
  }

  // ===== REDIS BACKEND =====

  // List all simulations (Redis)
  fastify.get('/api/simulations', async (request, reply) => {
    if (!redis) {
      return reply.code(503).send({ error: 'Redis not available' });
    }

    try {
      const keys = await redis.keys(`${REDIS_PREFIX}*`);
      const metadataList: SimulationMetadata[] = [];

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const snapshot: SimulationSnapshot = JSON.parse(data);
          let deviceCount = 0;
          snapshot.nodes.forEach((node) => {
            deviceCount += node.devices?.length || 0;
          });

          metadataList.push({
            id: snapshot.id,
            name: snapshot.name,
            description: snapshot.description,
            createdAt: snapshot.createdAt,
            lastModified: snapshot.lastModified,
            nodeCount: snapshot.nodes.length,
            deviceCount,
          });
        }
      }

      return metadataList;
    } catch (error) {
      console.error('Failed to list simulations from Redis:', error);
      return reply.code(500).send({ error: 'Failed to list simulations' });
    }
  });

  // Get simulation by ID (Redis)
  fastify.get('/api/simulations/:id', async (request, reply) => {
    if (!redis) {
      return reply.code(503).send({ error: 'Redis not available' });
    }

    const { id } = request.params as { id: string };
    const key = `${REDIS_PREFIX}${id}`;

    try {
      const data = await redis.get(key);
      if (!data) {
        return reply.code(404).send({ error: 'Simulation not found' });
      }

      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to get simulation from Redis:', error);
      return reply.code(500).send({ error: 'Failed to get simulation' });
    }
  });

  // Save simulation (Redis)
  fastify.post('/api/simulations', async (request, reply) => {
    if (!redis) {
      return reply.code(503).send({ error: 'Redis not available' });
    }

    const snapshot = request.body as SimulationSnapshot;
    const key = `${REDIS_PREFIX}${snapshot.id}`;

    try {
      await redis.set(key, JSON.stringify(snapshot));
      // Set TTL to 90 days
      await redis.expire(key, 90 * 24 * 60 * 60);

      return { success: true, id: snapshot.id };
    } catch (error) {
      console.error('Failed to save simulation to Redis:', error);
      return reply.code(500).send({ error: 'Failed to save simulation' });
    }
  });

  // Delete simulation (Redis)
  fastify.delete('/api/simulations/:id', async (request, reply) => {
    if (!redis) {
      return reply.code(503).send({ error: 'Redis not available' });
    }

    const { id } = request.params as { id: string };
    const key = `${REDIS_PREFIX}${id}`;

    try {
      await redis.del(key);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete simulation from Redis:', error);
      return reply.code(500).send({ error: 'Failed to delete simulation' });
    }
  });

  // Get Redis stats
  fastify.get('/api/simulations/stats', async (request, reply) => {
    if (!redis) {
      return reply.code(503).send({ error: 'Redis not available' });
    }

    try {
      const keys = await redis.keys(`${REDIS_PREFIX}*`);
      let totalSize = 0;

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          totalSize += data.length;
        }
      }

      const sizeKB = (totalSize / 1024).toFixed(2);
      const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
      const sizeFormatted = totalSize > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

      return {
        totalSimulations: keys.length,
        totalSize,
        sizeFormatted,
      };
    } catch (error) {
      console.error('Failed to get stats from Redis:', error);
      return reply.code(500).send({ error: 'Failed to get stats' });
    }
  });

  // Clear all simulations (Redis)
  fastify.delete('/api/simulations', async (request, reply) => {
    if (!redis) {
      return reply.code(503).send({ error: 'Redis not available' });
    }

    try {
      const keys = await redis.keys(`${REDIS_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return { success: true, deleted: keys.length };
    } catch (error) {
      console.error('Failed to clear simulations from Redis:', error);
      return reply.code(500).send({ error: 'Failed to clear simulations' });
    }
  });

  // ===== FILE BACKEND =====

  // Health check for file backend
  fastify.get('/api/simulations/file/health', async (request, reply) => {
    try {
      await fs.access(FILE_DIR);
      return { available: true };
    } catch {
      return { available: false };
    }
  });

  // List all simulations (File)
  fastify.get('/api/simulations/file', async (request, reply) => {
    try {
      const files = await fs.readdir(FILE_DIR);
      const metadataList: SimulationMetadata[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(FILE_DIR, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const snapshot: SimulationSnapshot = JSON.parse(data);

          let deviceCount = 0;
          snapshot.nodes.forEach((node) => {
            deviceCount += node.devices?.length || 0;
          });

          metadataList.push({
            id: snapshot.id,
            name: snapshot.name,
            description: snapshot.description,
            createdAt: snapshot.createdAt,
            lastModified: snapshot.lastModified,
            nodeCount: snapshot.nodes.length,
            deviceCount,
          });
        }
      }

      return metadataList;
    } catch (error) {
      console.error('Failed to list simulations from files:', error);
      return reply.code(500).send({ error: 'Failed to list simulations' });
    }
  });

  // Get simulation by ID (File)
  fastify.get('/api/simulations/file/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const filePath = path.join(FILE_DIR, `${id}.json`);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return reply.code(404).send({ error: 'Simulation not found' });
      }
      console.error('Failed to get simulation from file:', error);
      return reply.code(500).send({ error: 'Failed to get simulation' });
    }
  });

  // Save simulation (File)
  fastify.post('/api/simulations/file', async (request, reply) => {
    const snapshot = request.body as SimulationSnapshot;
    const filePath = path.join(FILE_DIR, `${snapshot.id}.json`);

    try {
      await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
      return { success: true, id: snapshot.id };
    } catch (error) {
      console.error('Failed to save simulation to file:', error);
      return reply.code(500).send({ error: 'Failed to save simulation' });
    }
  });

  // Delete simulation (File)
  fastify.delete('/api/simulations/file/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const filePath = path.join(FILE_DIR, `${id}.json`);

    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return reply.code(404).send({ error: 'Simulation not found' });
      }
      console.error('Failed to delete simulation file:', error);
      return reply.code(500).send({ error: 'Failed to delete simulation' });
    }
  });

  // Get File stats
  fastify.get('/api/simulations/file/stats', async (request, reply) => {
    try {
      const files = await fs.readdir(FILE_DIR);
      let totalSize = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(FILE_DIR, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }

      const jsonFiles = files.filter((f) => f.endsWith('.json'));
      const sizeKB = (totalSize / 1024).toFixed(2);
      const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
      const sizeFormatted = totalSize > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

      return {
        totalSimulations: jsonFiles.length,
        totalSize,
        sizeFormatted,
      };
    } catch (error) {
      console.error('Failed to get stats from files:', error);
      return reply.code(500).send({ error: 'Failed to get stats' });
    }
  });

  // Clear all simulations (File)
  fastify.delete('/api/simulations/file', async (request, reply) => {
    try {
      const files = await fs.readdir(FILE_DIR);
      let deleted = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(FILE_DIR, file);
          await fs.unlink(filePath);
          deleted++;
        }
      }

      return { success: true, deleted };
    } catch (error) {
      console.error('Failed to clear simulation files:', error);
      return reply.code(500).send({ error: 'Failed to clear simulations' });
    }
  });

  console.log('✅ Simulation persistence routes registered (Redis + File)');
}
