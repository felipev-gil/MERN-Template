const jwt = require('jsonwebtoken');
const users = require('../models/userModel');
const { COOKIE_NAME } = require('../utils/session');
function requireAuth(config) {
  return async (req, res, next) => {
    let payload;
    try { payload = jwt.verify(req.cookies[COOKIE_NAME] || '', config.jwtSecret, { algorithms: ['HS256'] }); }
    catch { return res.status(401).json({ message: 'Please sign in to continue.' }); }
    if (typeof payload.sub !== 'string') return res.status(401).json({ message: 'Invalid session.' });
    const user = await users.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Please sign in to continue.' });
    if ((payload.version ?? 0) !== (user.sessionVersion || 0)) return res.status(401).json({ message: 'Please sign in again.' });
    req.sessionExpiresAt = payload.exp * 1000;
    req.user = users.publicUser(user);
    next();
  };
}
module.exports = { requireAuth };

