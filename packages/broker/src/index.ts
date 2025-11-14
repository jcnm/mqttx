// Main Broker Entry Point
// Initializes and starts the Sparkplug MQTT broker

import 'dotenv/config';
import { ConfigLoader } from './config/loader.js';
import { StateManager, StatePersistence } from '@sparkplug/state';
import { SparkplugBroker } from './mqtt/broker.js';
import { SparkplugAwareBroker } from './mqtt/aware.js';
import { createServer } from './server.js';
import { resolve } from 'node:path';

async function main() {
  console.log('🚀 Starting Sparkplug MQTT Broker...');

  // Load configuration
  const configPath = process.env.CONFIG_PATH || resolve('./config/sparkplug.yaml');
  const config = new ConfigLoader(configPath);
  console.log(`✅ Configuration loaded (version: ${config.sparkplugVersion})`);

  // Initialize state manager
  const stateManager = new StateManager();
  console.log('✅ State manager initialized');

  // Initialize Redis persistence
  const redisConfig = config.getRedisConfig();

  // Override with environment variables if set (for Docker)
  const redisHost = process.env.REDIS_HOST || redisConfig.host;
  const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : redisConfig.port;
  const redisDb = process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : redisConfig.db;
  const redisPassword = process.env.REDIS_PASSWORD || redisConfig.password;

  console.log(`📡 Connecting to Redis at ${redisHost}:${redisPort}...`);

  const persistence = new StatePersistence({
    host: redisHost,
    port: redisPort,
    db: redisDb,
    password: redisPassword || undefined,
    keyPrefix: 'sparkplug:',
  });

  try {
    await persistence.connect();
    console.log('✅ Redis persistence connected');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️  Redis not available, using in-memory storage');
    console.warn(`   Reason: ${errorMessage}`);
    console.warn(`   Tried: ${redisHost}:${redisPort}`);
  }

  // Initialize MQTT broker
  const broker = new SparkplugBroker({
    config,
    stateManager,
  });

  // Initialize Sparkplug Aware features
  if (config.isAwareEnabled()) {
    const awareBroker = new SparkplugAwareBroker({
      config,
      aedes: broker.getAedes(),
      persistence,
    });
    console.log('✅ Sparkplug Aware features enabled');
  }

  // Start MQTT broker
  await broker.start();

  // Create and start REST API server
  const fastify = await createServer({
    config,
    broker,
    stateManager,
    redis: persistence.getClient(), // Pass Redis client for SCADA history
  });

  const apiPort = process.env.API_PORT || 3000;
  await fastify.listen({ port: Number(apiPort), host: '0.0.0.0' });
  console.log(`✅ REST API server listening on port ${apiPort}`);

  console.log('');
  console.log('🎉 Sparkplug MQTT Broker is ready!');
  console.log('');
  console.log(`📡 MQTT Broker: mqtt://localhost:${config.getMQTTConfig().ports.tcp}`);
  console.log(`🌐 REST API: http://localhost:${apiPort}`);
  console.log(`📊 Health Check: http://localhost:${apiPort}/health`);
  console.log(`📈 Stats: http://localhost:${apiPort}/api/broker/stats`);
  console.log('');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');

    await fastify.close();
    await broker.stop();
    await persistence.disconnect();

    console.log('👋 Goodbye!');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');

    await fastify.close();
    await broker.stop();
    await persistence.disconnect();

    console.log('👋 Goodbye!');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
