jest.mock('../config/database', () => ({ assertReady: jest.fn() }));
jest.mock('@upstash/redis', () => ({ Redis: jest.fn() }));
const { assertReady } = require('../config/database');
const { Redis } = require('@upstash/redis');
const { checkReadiness } = require('../config/readiness');
const { createApp } = require('../app');
const request = require('supertest');
beforeEach(() => { jest.resetAllMocks(); });
test('readiness detects database failure while liveness stays available', async () => {
 assertReady.mockRejectedValue(new Error('private connection details'));
 const app = createApp({ clientOrigin: 'http://localhost:5173', rateLimitEnabled: false });
 await request(app).get('/api/health').expect(200);
 const result = await request(app).get('/api/ready').expect(503);
 expect(result.body).toEqual({ status: 'unavailable' });
});
test('readiness checks Redis only when enabled and does not consume limiter quota', async () => {
 assertReady.mockResolvedValue();
 await expect(checkReadiness({ rateLimitEnabled: false })).resolves.toBeUndefined();
 expect(Redis).not.toHaveBeenCalled();
 Redis.mockImplementation(() => ({ ping: () => Promise.reject(new Error('Offline')) }));
 await expect(checkReadiness({ rateLimitEnabled: true })).rejects.toThrow('Offline');
});
