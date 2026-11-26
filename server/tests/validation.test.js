import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEvent } from '../src/validators/event.js';

const valid = { session_id: 'session-1', event_type: 'click', page_url: 'https://shop.example/products', timestamp: '2026-11-26T12:00:00.000Z', properties: { x: 120, y: 240, viewport_width: 1440, viewport_height: 900 } };
test('accepts valid page view and click payloads', () => {
  assert.equal(validateEvent(valid), null);
  assert.equal(validateEvent({ ...valid, event_type: 'page_view', properties: { title: 'Store' } }), null);
});
test('rejects invalid event types, URLs, timestamps, and unexpected keys', () => {
  assert.match(validateEvent({ ...valid, event_type: 'purchase' }), /event_type/);
  assert.match(validateEvent({ ...valid, page_url: 'javascript:alert(1)' }), /HTTP or HTTPS/);
  assert.match(validateEvent({ ...valid, timestamp: 'yesterday' }), /timestamp/);
  assert.match(validateEvent({ ...valid, email: 'visitor@example.com' }), /unsupported fields/);
});
test('requires valid viewport dimensions and coordinates for clicks', () => {
  assert.match(validateEvent({ ...valid, properties: { ...valid.properties, x: -1 } }), /properties.x/);
  assert.match(validateEvent({ ...valid, properties: { ...valid.properties, x: 1441 } }), /within the recorded viewport/);
  assert.match(validateEvent({ ...valid, properties: { x: 1, y: 1 } }), /viewport_width/);
});
