// Store and Forward
// Stores messages when disconnected and forwards when reconnected

import Redis from 'ioredis';

export interface StoreForwardOptions {
  redisHost?: string;
  redisPort?: number;
  redisDb?: number;
  maxQueueSize?: number;
  keyPrefix?: string;
}

export interface QueuedMessage {
  topic: string;
  payload: Buffer;
  qos: 0 | 1 | 2;
  timestamp: number;
}

export class StoreAndForward {
  private redis: Redis;
  private keyPrefix: string;
  private maxQueueSize: number;

  constructor(options: StoreForwardOptions = {}) {
    this.keyPrefix = options.keyPrefix || 'sparkplug:sf:';
    this.maxQueueSize = options.maxQueueSize || 10000;

    this.redis = new Redis({
      host: options.redisHost || 'localhost',
      port: options.redisPort || 6379,
      db: options.redisDb || 0,
      lazyConnect: true,
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
    console.log('✅ Store & Forward connected to Redis');
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  /**
   * Store a message for later forwarding
   */
  async store(message: QueuedMessage): Promise<void> {
    const key = `${this.keyPrefix}queue`;
    const data = JSON.stringify({
      ...message,
      payload: message.payload.toString('base64'),
    });

    // Add to queue
    await this.redis.lpush(key, data);

    // Trim queue to max size
    await this.redis.ltrim(key, 0, this.maxQueueSize - 1);

    console.log(`💾 Stored message for topic: ${message.topic}`);
  }

  /**
   * Get all stored messages
   */
  async getAll(): Promise<QueuedMessage[]> {
    const key = `${this.keyPrefix}queue`;
    const items = await this.redis.lrange(key, 0, -1);

    return items.map((item) => {
      const parsed = JSON.parse(item);
      return {
        ...parsed,
        payload: Buffer.from(parsed.payload, 'base64'),
      };
    });
  }

  /**
   * Forward all stored messages
   */
  async flush(
    publishFn: (topic: string, payload: Buffer, qos: 0 | 1 | 2) => Promise<void>
  ): Promise<number> {
    const messages = await this.getAll();

    for (const message of messages) {
      try {
        await publishFn(message.topic, message.payload, message.qos);
        console.log(`📤 Forwarded message for topic: ${message.topic}`);
      } catch (error) {
        console.error(`Error forwarding message:`, error);
      }
    }

    // Clear queue
    const key = `${this.keyPrefix}queue`;
    await this.redis.del(key);

    console.log(`✅ Flushed ${messages.length} stored messages`);
    return messages.length;
  }

  /**
   * Get queue size
   */
  async size(): Promise<number> {
    const key = `${this.keyPrefix}queue`;
    return this.redis.llen(key);
  }

  /**
   * Clear queue
   */
  async clear(): Promise<void> {
    const key = `${this.keyPrefix}queue`;
    await this.redis.del(key);
    console.log('✅ Store & Forward queue cleared');
  }
}
