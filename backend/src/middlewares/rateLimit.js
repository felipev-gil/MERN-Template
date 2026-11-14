const { Redis } = require('@upstash/redis');
const { Ratelimit } = require('@upstash/ratelimit');
function createAuthLimiter(config) {
  if (!config.rateLimitEnabled) return (req, res, next) => next();
  const limiter = new Ratelimit({ redis: new Redis({ url: config.redisUrl, token: config.redisToken }), limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'mern-template:auth', timeout: 3000 });
  return async (req, res, next) => {
    try {
      const result = await limiter.limit(req.ip);
      if (result.reason === 'timeout') return res.status(503).json({ message: 'Sign-in is temporarily unavailable. Please try again.' });
      if (!result.success) {
        res.set('Retry-After', String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))));
        return res.status(429).json({ message: 'Too many attempts. Please wait a minute.' });
      }
      next();
    } catch { res.status(503).json({ message: 'Sign-in is temporarily unavailable. Please try again.' }); }
  };
}
module.exports = { createAuthLimiter };

