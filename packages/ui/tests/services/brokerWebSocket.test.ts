import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrokerWebSocketService, getBrokerWebSocket } from '../../src/services/brokerWebSocket';

// Mock the broker store
const mockStore = {
  clearLogs: vi.fn(),
  updateStats: vi.fn(),
  addSession: vi.fn(),
  addLog: vi.fn(),
  removeSession: vi.fn(),
  updateSession: vi.fn(),
  addSubscription: vi.fn(),
};

vi.mock('../../src/stores/brokerStore', () => ({
  useBrokerStore: {
    getState: () => mockStore,
  },
}));

// Mock WebSocket
class MockWebSocket {
  public readyState = WebSocket.OPEN;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Mock CloseEvent
(global as any).CloseEvent = class CloseEvent extends Event {
  constructor(type: string, init?: any) {
    super(type, init);
  }
};

// Replace global WebSocket
(global as any).WebSocket = MockWebSocket;
(global as any).WebSocket.CONNECTING = 0;
(global as any).WebSocket.OPEN = 1;
(global as any).WebSocket.CLOSING = 2;
(global as any).WebSocket.CLOSED = 3;

describe('BrokerWebSocket Service', () => {
  describe('Service Creation', () => {
    it('should create service with URL', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      expect(service).toBeDefined();
      expect(typeof service.connect).toBe('function');
      expect(typeof service.disconnect).toBe('function');
      expect(typeof service.isConnected).toBe('function');
    });

    it('should support getBrokerWebSocket singleton', () => {
      const instance = getBrokerWebSocket();
      expect(instance).toBeDefined();
      expect(instance).toBeInstanceOf(BrokerWebSocketService);
    });

    it('should return same instance from getBrokerWebSocket', () => {
      const instance1 = getBrokerWebSocket();
      const instance2 = getBrokerWebSocket();
      expect(instance1).toBe(instance2);
    });
  });

  describe('API Methods', () => {
    it('should have connect method', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      expect(typeof service.connect).toBe('function');
    });

    it('should have disconnect method', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      expect(typeof service.disconnect).toBe('function');
    });

    it('should have isConnected method', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      expect(typeof service.isConnected).toBe('function');
    });

    it('should return boolean from isConnected', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      const connected = service.isConnected();
      expect(typeof connected).toBe('boolean');
    });
  });

  describe('URL Handling', () => {
    it('should accept localhost URL', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      expect(service).toBeDefined();
    });

    it('should accept IP address URL', () => {
      const service = new BrokerWebSocketService('ws://127.0.0.1:3000/ws');
      expect(service).toBeDefined();
    });

    it('should accept custom port', () => {
      const service = new BrokerWebSocketService('ws://localhost:8080/ws');
      expect(service).toBeDefined();
    });

    it('should accept custom path', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/custom/path');
      expect(service).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should not throw on disconnect when not connected', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      expect(() => service.disconnect()).not.toThrow();
    });

    it('should handle multiple disconnect calls', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      expect(() => {
        service.disconnect();
        service.disconnect();
        service.disconnect();
      }).not.toThrow();
    });

    it('should handle multiple connect calls', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      expect(() => {
        service.connect();
        service.connect();
        service.connect();
      }).not.toThrow();
    });
  });

  describe('WebSocket Lifecycle', () => {
    it('should call connect without throwing', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      expect(() => service.connect()).not.toThrow();
    });

    it('should call disconnect without throwing', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      service.connect();
      expect(() => service.disconnect()).not.toThrow();
    });

    it('should support reconnection', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      expect(() => {
        service.connect();
        service.disconnect();
        service.connect();
        service.disconnect();
      }).not.toThrow();
    });
  });

  describe('Instance Properties', () => {
    it('should be instanceof BrokerWebSocketService', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      expect(service).toBeInstanceOf(BrokerWebSocketService);
    });

    it('should have working isConnected method', () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      const result = service.isConnected();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Multiple Instances', () => {
    it('should allow multiple independent instances', () => {
      const service1 = new BrokerWebSocketService('ws://localhost:3000/ws');
      const service2 = new BrokerWebSocketService('ws://localhost:3001/ws');

      expect(service1).toBeDefined();
      expect(service2).toBeDefined();
      expect(service1).not.toBe(service2);
    });

    it('should work with different URLs', () => {
      const urls = [
        'ws://localhost:3000/ws',
        'ws://127.0.0.1:8080/ws',
        'ws://broker.example.com:1883/ws',
      ];

      urls.forEach((url) => {
        const service = new BrokerWebSocketService(url);
        expect(service).toBeDefined();
      });
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle initial message with stats', async () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      service.connect();

      await new Promise(resolve => setTimeout(resolve, 10));

      const initialMessage = {
        type: 'initial',
        data: {
          stats: { activeConnections: 5, totalMessages: 100 },
          sessions: [],
          logs: [],
        },
      };

      // @ts-ignore - accessing private ws for testing
      if (service['ws'] && service['ws'].onmessage) {
        service['ws'].onmessage(new MessageEvent('message', {
          data: JSON.stringify(initialMessage)
        }));
      }

      expect(mockStore.clearLogs).toHaveBeenCalled();
      expect(mockStore.updateStats).toHaveBeenCalledWith(initialMessage.data.stats);
    });

    it('should handle initial message with sessions', async () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      service.connect();

      await new Promise(resolve => setTimeout(resolve, 10));

      const initialMessage = {
        type: 'initial',
        data: {
          stats: {},
          sessions: [{
            clientId: 'test-client',
            ip: '127.0.0.1',
            port: 1234,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
            cleanSession: true,
            keepAlive: 60,
            protocolVersion: 4,
            isStale: false,
            subscriptions: ['test/topic'],
          }],
          logs: [],
        },
      };

      // @ts-ignore
      if (service['ws'] && service['ws'].onmessage) {
        service['ws'].onmessage(new MessageEvent('message', {
          data: JSON.stringify(initialMessage)
        }));
      }

      expect(mockStore.addSession).toHaveBeenCalled();
    });

    it('should handle log message', async () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      service.connect();

      await new Promise(resolve => setTimeout(resolve, 10));

      const logMessage = {
        type: 'log',
        data: {
          id: 'log-1',
          timestamp: Date.now(),
          type: 'publish',
          clientId: 'test-client',
          topic: 'test/topic',
          origin: { ip: '127.0.0.1', port: 1234 },
        },
      };

      // @ts-ignore
      if (service['ws'] && service['ws'].onmessage) {
        service['ws'].onmessage(new MessageEvent('message', {
          data: JSON.stringify(logMessage)
        }));
      }

      expect(mockStore.addLog).toHaveBeenCalled();
    });

    it('should handle clientConnect message', async () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      service.connect();

      await new Promise(resolve => setTimeout(resolve, 10));

      const connectMessage = {
        type: 'clientConnect',
        data: {
          clientId: 'new-client',
          ip: '127.0.0.1',
          port: 5678,
          subscriptions: ['topic1', 'topic2'],
          connectedAt: Date.now(),
          lastActivity: Date.now(),
          cleanSession: true,
          keepAlive: 60,
          protocolVersion: 4,
          isStale: false,
        },
      };

      // @ts-ignore
      if (service['ws'] && service['ws'].onmessage) {
        service['ws'].onmessage(new MessageEvent('message', {
          data: JSON.stringify(connectMessage)
        }));
      }

      expect(mockStore.addSession).toHaveBeenCalled();
      expect(mockStore.addSubscription).toHaveBeenCalled();
    });

    it('should handle clientDisconnect message', async () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      service.connect();

      await new Promise(resolve => setTimeout(resolve, 10));

      const disconnectMessage = {
        type: 'clientDisconnect',
        data: { clientId: 'test-client' },
      };

      // @ts-ignore
      if (service['ws'] && service['ws'].onmessage) {
        service['ws'].onmessage(new MessageEvent('message', {
          data: JSON.stringify(disconnectMessage)
        }));
      }

      expect(mockStore.removeSession).toHaveBeenCalledWith('test-client');
    });

    it('should handle sessionStale message', async () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      service.connect();

      await new Promise(resolve => setTimeout(resolve, 10));

      const staleMessage = {
        type: 'sessionStale',
        data: { clientId: 'test-client' },
      };

      // @ts-ignore
      if (service['ws'] && service['ws'].onmessage) {
        service['ws'].onmessage(new MessageEvent('message', {
          data: JSON.stringify(staleMessage)
        }));
      }

      expect(mockStore.updateSession).toHaveBeenCalledWith('test-client', { isStale: true });
    });

    it('should handle stats message', async () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      service.connect();

      await new Promise(resolve => setTimeout(resolve, 10));

      const statsMessage = {
        type: 'stats',
        data: { activeConnections: 10, totalMessages: 500 },
      };

      // @ts-ignore
      if (service['ws'] && service['ws'].onmessage) {
        service['ws'].onmessage(new MessageEvent('message', {
          data: JSON.stringify(statsMessage)
        }));
      }

      expect(mockStore.updateStats).toHaveBeenCalledWith(statsMessage.data);
    });

    it('should handle pong message without error', async () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      service.connect();

      await new Promise(resolve => setTimeout(resolve, 10));

      const pongMessage = { type: 'pong' };

      // @ts-ignore
      expect(() => {
        if (service['ws'] && service['ws'].onmessage) {
          service['ws'].onmessage(new MessageEvent('message', {
            data: JSON.stringify(pongMessage)
          }));
        }
      }).not.toThrow();
    });

    it('should handle unknown message type gracefully', async () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      service.connect();

      await new Promise(resolve => setTimeout(resolve, 10));

      const unknownMessage = { type: 'unknown', data: {} };

      // @ts-ignore
      expect(() => {
        if (service['ws'] && service['ws'].onmessage) {
          service['ws'].onmessage(new MessageEvent('message', {
            data: JSON.stringify(unknownMessage)
          }));
        }
      }).not.toThrow();
    });

    it('should handle invalid JSON gracefully', async () => {
      const service = new BrokerWebSocketService('ws://localhost:3000/ws');
      service.connect();

      await new Promise(resolve => setTimeout(resolve, 10));

      // @ts-ignore
      expect(() => {
        if (service['ws'] && service['ws'].onmessage) {
          service['ws'].onmessage(new MessageEvent('message', {
            data: 'invalid json {{{'
          }));
        }
      }).not.toThrow();
    });
  });
});
