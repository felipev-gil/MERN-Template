jest.mock('../models/userModel', () => ({ ...jest.requireActual('../models/userModel'), findByEmail: jest.fn(), findById: jest.fn(), create: jest.fn(), revokeSessions: jest.fn() }));
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const users = require('../models/userModel');
const { createApp } = require('../app');
const config = { mode: 'test', clientOrigin: 'http://localhost:5173', jwtSecret: 'test-only-secret-that-is-at-least-32-characters', rateLimitEnabled: false };
const app = createApp(config);
const account = { _id: '507f1f77bcf86cd799439011', name: 'Alex', email: 'alex@example.com', createdAt: new Date('2025-01-01') };
const fields = { name: 'Alex', email: 'alex@example.com', password: 'example-password' };
const post = (route, body) => request(app).post('/api/auth/' + route).set('Origin', config.clientOrigin).send(body);
beforeEach(() => { jest.resetAllMocks(); users.findByEmail.mockResolvedValue(null); users.findById.mockResolvedValue(account); users.create.mockResolvedValue(account); });
test('health is public and unknown routes return JSON', async () => {
  expect((await request(app).get('/api/health')).body).toEqual({ status: 'ok' });
  expect((await request(app).get('/missing')).status).toBe(404);
});
test('registration hashes passwords, normalizes email, sets cookie and restores session', async () => {
  const response = await post('register', { ...fields, email: ' ALEX@example.com ' });
  expect(response.status).toBe(201);
  const saved = users.create.mock.calls[0][0];
  expect(saved.email).toBe(fields.email);
  expect(saved.passwordHash).not.toBe(fields.password);
  expect(await bcrypt.compare(fields.password, saved.passwordHash)).toBe(true);
  expect(response.body.user).not.toHaveProperty('passwordHash');
  expect(response.body).not.toHaveProperty('token');
  const cookie = response.headers['set-cookie'][0];
  expect(cookie).toContain('HttpOnly'); expect(cookie).toContain('SameSite=Lax');
  const me = await request(app).get('/api/auth/me').set('Cookie', cookie.split(';')[0]);
  expect(me.status).toBe(200); expect(me.body.user.email).toBe(fields.email);
});
test.each([{ ...fields, email: 'bad' }, { ...fields, password: 'short' }, { ...fields, name: ' ' }, { ...fields, password: '😀'.repeat(19) }, { ...fields, email: {} }])('rejects invalid registration without writing to database', async body => {
  const response = await post('register', body);
  expect(response.status).toBe(400); expect(users.create).not.toHaveBeenCalled();
  expect(JSON.stringify(response.body)).not.toContain('example-password');
});
test('duplicate email and concurrent duplicate insertion return 409', async () => {
  users.findByEmail.mockResolvedValueOnce(account);
  expect((await post('register', fields)).status).toBe(409);
  users.create.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 11000 }));
  expect((await post('register', fields)).status).toBe(409);
});
test('valid login sets a session; wrong password and unknown email return the same error', async () => {
  users.findByEmail.mockResolvedValueOnce({ ...account, passwordHash: await bcrypt.hash(fields.password, 4) });
  expect((await post('login', fields)).status).toBe(200);
  users.findByEmail.mockResolvedValueOnce({ ...account, passwordHash: await bcrypt.hash('different-password', 4) });
  const wrong = await post('login', fields);
  const missing = await post('login', fields);
  expect(wrong.status).toBe(401); expect(missing.status).toBe(401); expect(wrong.body).toEqual(missing.body);
});
test('missing, tampered and expired sessions are rejected', async () => {
  expect((await request(app).get('/api/auth/me')).status).toBe(401);
  expect((await request(app).get('/api/auth/me').set('Cookie', 'mern_session=invalid')).status).toBe(401);
  const expired = jwt.sign({}, config.jwtSecret, { subject: '1', expiresIn: -1 });
  expect((await request(app).get('/api/auth/me').set('Cookie', 'mern_session=' + expired)).status).toBe(401);
});
test('a deleted user cannot reuse a valid session', async () => {
  users.findById.mockResolvedValueOnce(null);
  const token = jwt.sign({}, config.jwtSecret, { subject: '1', expiresIn: '1h' });
  expect((await request(app).get('/api/auth/me').set('Cookie', 'mern_session=' + token)).status).toBe(401);
});
test('logout expires the cookie, even without an existing session', async () => {
  const response = await post('logout', {});
  expect(response.status).toBe(204); expect(response.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
});
test('production cookies require HTTPS', async () => {
  const response = await request(createApp({ ...config, mode: 'production' })).post('/api/auth/register').set('Origin', config.clientOrigin).send(fields);
  expect(response.headers['set-cookie'][0]).toContain('Secure');
});
test('untrusted and missing origins cannot perform writes', async () => {
  expect((await request(app).post('/api/auth/register').set('Origin', 'https://untrusted.example').send(fields)).status).toBe(403);
  expect((await request(app).post('/api/auth/logout')).status).toBe(403);
  expect(users.create).not.toHaveBeenCalled();
});
test('malformed and oversized JSON produce safe client errors', async () => {
  const send = text => request(app).post('/api/auth/login').set('Origin', config.clientOrigin).set('Content-Type', 'application/json').send(text);
  expect((await send('{bad')).status).toBe(400);
  expect((await send(JSON.stringify({ password: 'x'.repeat(11000) }))).status).toBe(413);
});
test('database errors do not expose internal messages', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  users.findByEmail.mockRejectedValueOnce(new Error('private database connection details'));
  const response = await post('login', fields);
  expect(response.status).toBe(500); expect(JSON.stringify(response.body)).not.toContain('private');
  log.mockRestore();
});


test('rejects revoked sessions and keeps cookie names application-specific', async () => {
  const response = await post('register', fields);
  const cookie = response.headers['set-cookie'][0].split(';')[0];
  expect(cookie.startsWith('mern_session=')).toBe(true);
  users.findById.mockResolvedValueOnce({ ...account, sessionVersion: 1 });
  expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401);
  expect(response.body.sessionExpiresAt).toBeGreaterThan(Date.now());
});
test('logout invalidates previously issued tokens on the server', async () => {
  const response = await post('register', fields);
  const cookie = response.headers['set-cookie'][0].split(';')[0];
  await request(app).post('/api/auth/logout').set('Origin', config.clientOrigin).set('Cookie', cookie).expect(204);
  expect(users.revokeSessions).toHaveBeenCalledWith(String(account._id || account.id));
});
