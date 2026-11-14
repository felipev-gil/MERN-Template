const jwt = require('jsonwebtoken');
const COOKIE_NAME = 'mern_session';
const cookieOptions = config => ({ httpOnly: true, secure: config.mode === 'production', sameSite: 'lax', path: '/' });
function setSession(res, userId, config, version = 0) {
  const token = jwt.sign({ version }, config.jwtSecret, { subject: String(userId), expiresIn: '1h', algorithm: 'HS256' });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(config), maxAge: 60 * 60 * 1000 });
}
module.exports = { COOKIE_NAME, cookieOptions, setSession };

