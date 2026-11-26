import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { randomUUID } from 'node:crypto';
import { test as nodeTest } from 'node:test';
import Event from '../src/models/Event.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

test('rejects invalid ingestion payloads with a consistent response', async () => {
  const res = await request(app).post('/api/events').send({ event_type: 'purchase' });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.error.message, /session_id/);
});
test('returns a clear 404 for unknown routes', async () => {
  const res = await request(app).get('/api/not-a-route');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});
test('health reports database state without leaking internals', async () => {
  const res = await request(app).get('/api/health');
  assert.ok([200, 503].includes(res.status));
  assert.equal(res.body.data.database, res.status === 200 ? 'connected' : 'disconnected');
  assert.equal('stack' in res.body, false);
});
test('protects account analytics endpoints when no session cookie is sent', async () => {
  const res = await request(app).get('/api/overview');
  assert.equal(res.status, 401);
});

nodeTest('stores events and serves session aggregates and page clicks when MONGODB_TEST_URI is configured', { skip: !process.env.MONGODB_TEST_URI }, async (t) => {
  await mongoose.connect(process.env.MONGODB_TEST_URI);
  const sessionId = `integration-${randomUUID()}`;
  const email = `integration-${randomUUID()}@example.test`;
  const secondEmail = `integration-${randomUUID()}@example.test`;
  t.after(async () => { await Event.deleteMany({ session_id: sessionId }); await User.deleteMany({ email: { $in: [email, secondEmail] } }); await mongoose.disconnect(); });
  const signup = await request(app).post('/api/auth/signup').send({ name: 'Integration Tester', email, password: 'Sufficiently-Long-1' });
  assert.equal(signup.status, 201);
  const cookie = signup.headers['set-cookie'][0].split(';')[0];
  const siteId = signup.body.data.user.tracker_id;
  const base = { session_id: sessionId, site_id: siteId, page_url: 'https://shop.example/products', timestamp: new Date().toISOString() };
  const pageView = await request(app).post('/api/events').send({ ...base, event_type: 'page_view', properties: { title: 'Products' } });
  assert.equal(pageView.status, 201);
  const click = await request(app).post('/api/events').send({ ...base, event_type: 'click', properties: { x: 30, y: 50, viewport_width: 1280, viewport_height: 720 } });
  assert.equal(click.status, 201);
  const sessions = await request(app).get('/api/sessions').set('Cookie', cookie).query({ search: sessionId });
  assert.equal(sessions.body.data.sessions[0].total_events, 2);
  assert.equal(sessions.body.data.sessions[0].page_views, 1);
  const history = await request(app).get(`/api/sessions/${sessionId}/events`).set('Cookie', cookie);
  assert.deepEqual(history.body.data.events.map((event) => event.event_type), ['page_view', 'click']);
  const heatmap = await request(app).get('/api/heatmap').set('Cookie', cookie).query({ page_url: base.page_url });
  assert.ok(heatmap.body.data.total_clicks >= 1);
  assert.ok(heatmap.body.data.clicks.some((event) => event.session_id === sessionId && event.x === 30));
  const secondSignup = await request(app).post('/api/auth/signup').send({ name: 'Separate Account', email: secondEmail, password: 'Another-Long-Password-2' });
  assert.equal(secondSignup.status, 201);
  const separate = await request(app).get('/api/sessions').set('Cookie', secondSignup.headers['set-cookie'][0].split(';')[0]);
  assert.equal(separate.body.data.total, 0);
});
