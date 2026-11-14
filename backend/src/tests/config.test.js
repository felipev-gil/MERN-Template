const { readConfig } = require('../config/env');
const valid = { JWT_SECRET: 'test-secret-with-more-than-32-characters', CLIENT_ORIGIN: 'http://localhost:5173', MONGO_URI: 'test-database' };
test('defaults to development with rate limiting disabled', () => {
  expect(readConfig(valid)).toMatchObject({ mode: 'development', port: 5000, rateLimitEnabled: false, proxyHops: 0 });
});
test.each(['JWT_SECRET', 'CLIENT_ORIGIN', 'MONGO_URI'])('identifies missing %s', key => {
  expect(() => readConfig({ ...valid, [key]: '' })).toThrow(key);
});
test.each([{ JWT_SECRET: 'short' }, { CLIENT_ORIGIN: 'http://localhost:5173/path' }, { PORT: '0' }, { TRUST_PROXY_HOPS: '-1' }, { RATE_LIMIT_ENABLED: 'yes' }, { RATE_LIMIT_ENABLED: 'true' }, { NODE_ENV: 'production' }])('rejects invalid config', override => {
  expect(() => readConfig({ ...valid, ...override })).toThrow();
});


test.each([undefined, 'false'])('production requires throttling: %s', flag => {
  expect(() => readConfig({ ...valid, NODE_ENV: 'production', CLIENT_ORIGIN: 'https://app.example.test', RATE_LIMIT_ENABLED: flag })).toThrow('rate limiting');
});
test('accepts protected production configuration', () => {
  expect(readConfig({ ...valid, NODE_ENV: 'production', CLIENT_ORIGIN: 'https://app.example.test', RATE_LIMIT_ENABLED: 'true', UPSTASH_REDIS_REST_URL: 'https://redis.example.test', UPSTASH_REDIS_REST_TOKEN: 'test-token' }).rateLimitEnabled).toBe(true);
});
