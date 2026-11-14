const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

function readConfig(source = process.env) {
  const mode = source.NODE_ENV || 'development';
  if (!['development', 'test', 'production'].includes(mode)) throw new Error('Invalid NODE_ENV.');
  for (const key of ['JWT_SECRET', 'CLIENT_ORIGIN', 'MONGO_URI']) {
    if (!source[key]?.trim()) throw new Error('Missing environment variable: ' + key);
  }
  if (source.JWT_SECRET.length < 32 || source.JWT_SECRET.startsWith('replace-')) throw new Error('JWT_SECRET must be a random secret of at least 32 characters.');
  const origin = new URL(source.CLIENT_ORIGIN);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== source.CLIENT_ORIGIN) throw new Error('CLIENT_ORIGIN must be an exact HTTP(S) origin without a trailing slash.');
  if (mode === 'production' && origin.protocol !== 'https:') throw new Error('Production CLIENT_ORIGIN must use HTTPS.');
  const port = Number(source.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
  const proxyHops = Number(source.TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0) throw new Error('TRUST_PROXY_HOPS must be a nonnegative integer.');
  if (source.RATE_LIMIT_ENABLED && !['true', 'false'].includes(source.RATE_LIMIT_ENABLED)) throw new Error('RATE_LIMIT_ENABLED must be true or false.');
  const rateLimitEnabled = source.RATE_LIMIT_ENABLED === 'true';
  if (mode === 'production' && !rateLimitEnabled) throw new Error('Enable authentication rate limiting in production.');
  if (rateLimitEnabled && (!source.UPSTASH_REDIS_REST_URL || !source.UPSTASH_REDIS_REST_TOKEN)) throw new Error('Rate limiting requires both Upstash variables.');
  if (rateLimitEnabled && new URL(source.UPSTASH_REDIS_REST_URL).protocol !== 'https:') throw new Error('Upstash URL must use HTTPS.');
  return { mode, port, clientOrigin: origin.origin, jwtSecret: source.JWT_SECRET, databaseUrl: source.MONGO_URI, proxyHops, rateLimitEnabled, redisUrl: source.UPSTASH_REDIS_REST_URL, redisToken: source.UPSTASH_REDIS_REST_TOKEN };
}
module.exports = { readConfig };

