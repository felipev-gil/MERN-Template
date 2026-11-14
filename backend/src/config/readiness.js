const { assertReady } = require('./database');
const { Redis } = require('@upstash/redis');
async function checkReadiness(config) {
  let timer;
  try {
    await Promise.race([
      Promise.all([assertReady(), ...(config.rateLimitEnabled ? [new Redis({ url: config.redisUrl, token: config.redisToken }).ping()] : [])]),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Dependency timeout')), 3000); })
    ]);
  } finally { clearTimeout(timer); }
}
module.exports = { checkReadiness };
