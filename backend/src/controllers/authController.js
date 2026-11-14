const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const users = require('../models/userModel');
const { setSession, COOKIE_NAME, cookieOptions } = require('../utils/session');
function authController(config) {
  return {
    async register(req, res) {
      const { name, email, password } = req.body;
      if (await users.findByEmail(email)) return res.status(409).json({ message: 'An account with this email already exists.' });
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await users.create({ name, email, passwordHash });
      const safeUser = users.publicUser(user);
      setSession(res, safeUser.id, config, user.sessionVersion || 0);
      res.status(201).json({ user: safeUser, sessionExpiresAt: Date.now() + 60 * 60 * 1000 });
    },
    async login(req, res) {
      const user = await users.findByEmail(req.body.email);
      if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password.' });
      const safeUser = users.publicUser(user);
      setSession(res, safeUser.id, config, user.sessionVersion || 0);
      res.json({ user: safeUser, sessionExpiresAt: Date.now() + 60 * 60 * 1000 });
    },
    async logout(req, res) {
      let payload;
      try { payload = jwt.verify(req.cookies[COOKIE_NAME] || '', config.jwtSecret, { algorithms: ['HS256'] }); } catch { /* Clearing an invalid cookie is idempotent. */ }
      if (typeof payload?.sub === 'string') await users.revokeSessions(payload.sub);
      res.clearCookie(COOKIE_NAME, cookieOptions(config)); res.status(204).end();
    },
    me(req, res) { res.json({ user: req.user, sessionExpiresAt: req.sessionExpiresAt }); },
  };
}
module.exports = { authController };

