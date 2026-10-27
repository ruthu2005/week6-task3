import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

let adminToken = '';
let userToken = '';
let testUserId = '';

before(async () => {
  await connectDB();
});

after(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await User.deleteMany();

  // Seed baseline Admin
  const admin = await User.create({
    name: 'Admin Tester',
    email: 'admin.test@example.com',
    password: 'Password@123',
    role: 'admin'
  });

  // Seed baseline User
  const user = await User.create({
    name: 'Regular Tester',
    email: 'user.test@example.com',
    password: 'Password@123',
    role: 'user'
  });
  testUserId = user.id || user._id;

  // Obtain tokens via login endpoint
  const adminLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin.test@example.com', password: 'Password@123' });
  adminToken = adminLoginRes.body.token;

  const userLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user.test@example.com', password: 'Password@123' });
  userToken = userLoginRes.body.token;
});

test('1. Public Routes: GET / and GET /health should be accessible without credentials', async () => {
  const rootRes = await request(app).get('/');
  assert.equal(rootRes.status, 200);
  assert.equal(rootRes.body.success, true);

  const healthRes = await request(app).get('/health');
  assert.equal(healthRes.status, 200);
  assert.equal(healthRes.body.status, 'healthy');
});

test('2. Registration: New accounts default to "user" role and reject weak passwords', async () => {
  // Test password minimum length enforcement
  const weakRes = await request(app).post('/api/auth/register').send({
    name: 'Weak User',
    email: 'weak@example.com',
    password: 'short'
  });
  assert.equal(weakRes.status, 400);
  assert.equal(weakRes.body.code, 'WEAK_PASSWORD');

  // Successful registration with default 'user' role
  const regRes = await request(app).post('/api/auth/register').send({
    name: 'New Registered User',
    email: 'newuser@example.com',
    password: 'ValidPassword@123'
  });
  assert.equal(regRes.status, 201);
  assert.equal(regRes.body.user.role, 'user');
  assert.equal(regRes.body.user.password, undefined); // Ensure password is excluded
});

test('3. Login: JWT token payload must encode the correct user role', async () => {
  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'admin.test@example.com',
    password: 'Password@123'
  });
  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.body.token);
  assert.equal(loginRes.body.user.role, 'admin');

  // Verify decoded payload contains role
  const tokenParts = loginRes.body.token.split('.');
  const decodedPayload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
  assert.equal(decodedPayload.role, 'admin');
  assert.equal(decodedPayload.email, 'admin.test@example.com');
});

test('4. Authentication Middleware: 401 Unauthorized when token is missing or invalid', async () => {
  // Missing Authorization header
  const missingRes = await request(app).get('/api/admin/dashboard');
  assert.equal(missingRes.status, 401);
  assert.equal(missingRes.body.code, 'TOKEN_MISSING');

  // Invalid / corrupted token
  const invalidRes = await request(app)
    .get('/api/admin/dashboard')
    .set('Authorization', 'Bearer invalid.token.payload');
  assert.equal(invalidRes.status, 401);
  assert.equal(invalidRes.body.code, 'TOKEN_INVALID');
});

test('5. Role Authorization: 403 Forbidden when regular "user" accesses Admin Dashboard', async () => {
  const res = await request(app)
    .get('/api/admin/dashboard')
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'ACCESS_FORBIDDEN');
  assert.equal(res.body.userRole, 'user');
  assert.deepEqual(res.body.requiredRoles, ['admin']);
});

test('6. Role Authorization: 200 OK when "admin" accesses Admin Dashboard', async () => {
  const res = await request(app)
    .get('/api/admin/dashboard')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.stats);
  assert.equal(res.body.stats.systemStatus, 'operational');
  assert.equal(res.body.user.role, 'admin');
});

test('7. Protected Admin Route: GET /api/admin/users lists all users for admin, rejects user with 403', async () => {
  // Regular user rejected with 403
  const userRes = await request(app)
    .get('/api/admin/users')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(userRes.status, 403);

  // Admin granted 200 OK with users array
  const adminRes = await request(app)
    .get('/api/admin/users')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(adminRes.status, 200);
  assert.equal(adminRes.body.success, true);
  assert.ok(Array.isArray(adminRes.body.users));
  assert.ok(adminRes.body.users.length >= 2);
});

test('8. Role Management: Admin can update user role, regular user cannot (403)', async () => {
  // Regular user attempt -> 403 Forbidden
  const userAttemptRes = await request(app)
    .patch(`/api/admin/users/${testUserId}/role`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ role: 'admin' });
  assert.equal(userAttemptRes.status, 403);

  // Admin update -> 200 OK
  const adminUpdateRes = await request(app)
    .patch(`/api/admin/users/${testUserId}/role`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ role: 'admin' });
  assert.equal(adminUpdateRes.status, 200);
  assert.equal(adminUpdateRes.body.user.role, 'admin');
});

test('9. General Protected Route: /api/admin/profile-check succeeds (200) for BOTH user and admin', async () => {
  // User succeeds
  const userCheck = await request(app)
    .get('/api/admin/profile-check')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(userCheck.status, 200);
  assert.equal(userCheck.body.user.role, 'user');

  // Admin succeeds
  const adminCheck = await request(app)
    .get('/api/admin/profile-check')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(adminCheck.status, 200);
  assert.equal(adminCheck.body.user.role, 'admin');
});

test('10. Admin Safety Constraint: Admin cannot delete their own account', async () => {
  const profileRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${adminToken}`);
  const currentAdminId = profileRes.body.user.id;

  const deleteSelfRes = await request(app)
    .delete(`/api/admin/users/${currentAdminId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(deleteSelfRes.status, 400);
  assert.equal(deleteSelfRes.body.code, 'SELF_DELETION_PROHIBITED');
});
