const { checkReadiness } = require('./config/readiness');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { authRoutes } = require('./routes/authRoutes');
const { errorHandler } = require('./middlewares/errorHandler');
function createApp(config) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.proxyHops || false);
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-store');
    // Cookies are sent automatically. Require the trusted browser origin on writes.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== config.clientOrigin) return res.status(403).json({ message: 'Request origin is not allowed.' });
    next();
  });
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/ready', async (req, res) => {
    try { await checkReadiness(config); res.json({ status: 'ready' }); }
    catch { res.status(503).json({ status: 'unavailable' }); }
  });
  app.use('/api/auth', authRoutes(config));
  app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };

