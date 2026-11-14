jest.mock('@upstash/redis', () => ({ Redis: jest.fn() }));
jest.mock('@upstash/ratelimit', () => ({ Ratelimit: Object.assign(jest.fn(), { slidingWindow: jest.fn() }) }));
const { Ratelimit } = require('@upstash/ratelimit');
const { createAuthLimiter } = require('../middlewares/rateLimit');
const limit = jest.fn();
beforeEach(() => { limit.mockReset(); Ratelimit.mockImplementation(() => ({ limit })); });
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), set: jest.fn() });
test('disabled limiter makes no external call', async () => {
  const next = jest.fn(); await createAuthLimiter({ rateLimitEnabled: false })({}, response(), next);
  expect(next).toHaveBeenCalled(); expect(limit).not.toHaveBeenCalled();
});
test.each([{ result: { success: true }, status: null }, { result: { success: false, reset: Date.now() + 60000 }, status: 429 }, { result: { success: true, reason: 'timeout' }, status: 503 }])('handles limiter results', async ({ result, status }) => {
  limit.mockResolvedValueOnce(result);
  const res = response(), next = jest.fn();
  await createAuthLimiter({ rateLimitEnabled: true })({ ip: '127.0.0.1' }, res, next);
  if (status) { expect(res.status).toHaveBeenCalledWith(status); expect(next).not.toHaveBeenCalled(); }
  else expect(next).toHaveBeenCalled();
});
test('service outage fails closed', async () => {
  limit.mockRejectedValueOnce(new Error('offline'));
  const res = response(); await createAuthLimiter({ rateLimitEnabled: true })({ ip: '127.0.0.1' }, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(503);
});

