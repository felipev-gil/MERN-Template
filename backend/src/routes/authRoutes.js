const express = require('express');
const { authController } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');
const { createAuthLimiter } = require('../middlewares/rateLimit');
const { registerRules, loginRules } = require('../validators/authValidators');
function authRoutes(config) {
  const router = express.Router();
  const controller = authController(config);
  const limit = createAuthLimiter(config);
  router.post('/register', limit, registerRules, controller.register);
  router.post('/login', limit, loginRules, controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', requireAuth(config), controller.me);
  return router;
}
module.exports = { authRoutes };

