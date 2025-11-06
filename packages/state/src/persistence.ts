// State Persistence with Redis
// Persists state across broker restarts

import Redis from 'ioredis';
import type { NodeState, DeviceState, SessionState } from './types.js';

export interface PersistenceOptions {
  host?: string;
  port?: number;
  db?: number;
  password?: string;
  keyPrefix?: string;
}

export class StatePersistence {
  private redis: Redis;
  private keyPrefix: string;
  private connected: boolean = false;

  constructor(options: PersistenceOptions = {}) {
    this.keyPrefix = options.keyPrefix || 'sparkplug:state:';
    this.redis = new Redis({
      host: options.host || 'localhost',
      port: options.port || 6379,
      db: options.db || 0,
      password: options.password,
      lazyConnect: true,
      connectTimeout: 10000, // 10 seconds timeout for initial connection
      retryStrategy: (times: number) => {
        // Stop retrying after 10 attempts (~30 seconds total)
        if (times > 10) {
          console.warn('⚠️  Redis connection failed after 10 attempts, running without persistence');
          return null;
        }
        // Exponential backoff: 1s, 2s, 3s, 4s, 5s... max 5s
        const delay = Math.min(times * 1000, 5000);
        console.log(`   Retry ${times}/10 in ${delay}ms...`);
        return delay;
      },
    });

    // Handle Redis errors gracefully
    this.redis.on('error', (error) => {
      if (this.connected) {
        console.warn('⚠️  Redis connection error:', error.message);
      }
      this.connected = false;
    });

    this.redis.on('connect', () => {
      this.connected = true;
      console.log('✅ Redis connected successfully');
    });

    this.redis.on('close', () => {
      if (this.connected) {
        console.warn('⚠️  Redis connection closed');
      }
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Node State Persistence
  async saveNodeState(state: NodeState): Promise<void> {
    const key = `${this.keyPrefix}nodes:${state.groupId}:${state.edgeNodeId}`;
    const data = JSON.stringify({
      ...state,
      bdSeq: state.bdSeq.toString(),
      seq: state.seq.toString(),
      birthTimestamp: state.birthTimestamp?.toString(),
      metrics: state.metrics ? Array.from(state.metrics.entries()) : [],
    });

    await this.redis.set(key, data);
    await this.redis.expire(key, 86400); // 24 hours TTL
  }

  async loadNodeState(groupId: string, edgeNodeId: string): Promise<NodeState | null> {
    const key = `${this.keyPrefix}nodes:${groupId}:${edgeNodeId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    return {
      ...parsed,
      bdSeq: BigInt(parsed.bdSeq),
      seq: BigInt(parsed.seq),
      birthTimestamp: parsed.birthTimestamp ? BigInt(parsed.birthTimestamp) : undefined,
      metrics: new Map(parsed.metrics),
    };
  }

  async deleteNodeState(groupId: string, edgeNodeId: string): Promise<void> {
    const key = `${this.keyPrefix}nodes:${groupId}:${edgeNodeId}`;
    await this.redis.del(key);
  }

  async getAllNodeStates(): Promise<NodeState[]> {
    const keys = await this.redis.keys(`${this.keyPrefix}nodes:*`);
    const states: NodeState[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const parsed = JSON.parse(data);
        states.push({
          ...parsed,
          bdSeq: BigInt(parsed.bdSeq),
          seq: BigInt(parsed.seq),
          birthTimestamp: parsed.birthTimestamp ? BigInt(parsed.birthTimestamp) : undefined,
          metrics: new Map(parsed.metrics),
        });
      }
    }

    return states;
  }

  // Device State Persistence
  async saveDeviceState(state: DeviceState): Promise<void> {
    const key = `${this.keyPrefix}devices:${state.groupId}:${state.edgeNodeId}:${state.deviceId}`;
    const data = JSON.stringify({
      ...state,
      birthTimestamp: state.birthTimestamp?.toString(),
      metrics: state.metrics ? Array.from(state.metrics.entries()) : [],
    });

    await this.redis.set(key, data);
    await this.redis.expire(key, 86400); // 24 hours TTL
  }

  async loadDeviceState(
    groupId: string,
    edgeNodeId: string,
    deviceId: string
  ): Promise<DeviceState | null> {
    const key = `${this.keyPrefix}devices:${groupId}:${edgeNodeId}:${deviceId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    return {
      ...parsed,
      birthTimestamp: parsed.birthTimestamp ? BigInt(parsed.birthTimestamp) : undefined,
      metrics: new Map(parsed.metrics),
    };
  }

  // Session Persistence
  async saveSession(state: SessionState): Promise<void> {
    const key = `${this.keyPrefix}sessions:${state.clientId}`;
    const data = JSON.stringify({
      ...state,
      bdSeq: state.bdSeq?.toString(),
    });

    await this.redis.set(key, data);
    await this.redis.expire(key, 3600); // 1 hour TTL
  }

  async loadSession(clientId: string): Promise<SessionState | null> {
    const key = `${this.keyPrefix}sessions:${clientId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    return {
      ...parsed,
      bdSeq: parsed.bdSeq ? BigInt(parsed.bdSeq) : undefined,
    };
  }

  // Birth Certificate Storage
  async saveBirthCertificate(
    type: 'NBIRTH' | 'DBIRTH',
    groupId: string,
    edgeNodeId: string,
    deviceId: string | undefined,
    payload: Uint8Array
  ): Promise<void> {
    const key = deviceId
      ? `${this.keyPrefix}births:${type}:${groupId}:${edgeNodeId}:${deviceId}`
      : `${this.keyPrefix}births:${type}:${groupId}:${edgeNodeId}`;

    await this.redis.set(key, Buffer.from(payload));
    await this.redis.expire(key, 2592000); // 30 days TTL
  }

  async loadBirthCertificate(
    type: 'NBIRTH' | 'DBIRTH',
    groupId: string,
    edgeNodeId: string,
    deviceId?: string
  ): Promise<Uint8Array | null> {
    const key = deviceId
      ? `${this.keyPrefix}births:${type}:${groupId}:${edgeNodeId}:${deviceId}`
      : `${this.keyPrefix}births:${type}:${groupId}:${edgeNodeId}`;

    const data = await this.redis.getBuffer(key);
    return data ? new Uint8Array(data) : null;
  }
}
