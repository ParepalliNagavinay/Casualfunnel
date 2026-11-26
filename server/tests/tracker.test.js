import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const source = await readFile(path.resolve(here, '../../tracker/insightflow.js'), 'utf8');

function browser({ now = 1_800_000_000_000, storage = true, failFetch = false, initialRecord = null, siteId = '', search = '' } = {}) {
  const records = new Map(), handlers = {}, requests = [];
  const localStorage = { getItem: (k) => records.get(k) ?? null, setItem: (k, v) => records.set(k, v) };
  if (initialRecord) records.set('insightflow_session', initialRecord);
  if (!storage) { localStorage.getItem = () => { throw new Error('disabled'); }; localStorage.setItem = () => { throw new Error('disabled'); }; }
  const script = { getAttribute: (name) => name === 'data-api-url' ? 'https://api.example/api/events' : name === 'data-site-id' ? siteId : null };
  const document = { currentScript: script, title: 'Store', visibilityState: 'visible', querySelector: () => script, addEventListener: (name, cb) => { handlers[name] = cb; } };
  const window = { __insightFlowPageViewSent: false, location: { href: 'https://shop.example/item', search }, innerWidth: 1280, innerHeight: 720, localStorage, crypto: { randomUUID: () => 'uuid-test' }, fetch: (url, options) => { requests.push(JSON.parse(options.body)); return failFetch ? Promise.reject(new Error('offline')) : Promise.resolve({ ok: true }); } };
  const context = { window, document, navigator: {}, Blob, URLSearchParams, Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }, Math, JSON, Promise };
  vm.runInNewContext(source, context);
  return { requests, handlers, window, records };
}
test('emits one initial page view and document click with viewport coordinates', () => {
  const page = browser();
  assert.equal(page.requests.length, 1);
  assert.equal(page.requests[0].event_type, 'page_view');
  page.handlers.click({ target: { closest: () => null }, clientX: 42, clientY: 80 });
  const click = page.requests[1];
  assert.deepEqual([click.event_type, click.properties.x, click.properties.y, click.properties.viewport_width], ['click', 42, 80, 1280]);
  assert.equal(click.session_id, page.requests[0].session_id);
});
test('reuses a stored session and rotates it after 30 minutes of inactivity', () => {
  const first = browser();
  const existing = first.requests[0].session_id;
  const next = browser({ now: 1_800_000_000_000 + 1000, initialRecord: first.records.get('insightflow_session') });
  assert.equal(next.requests[0].session_id, existing);
  const expired = JSON.stringify({ id: 'old-session', lastSeen: 1_800_000_000_000 - 31 * 60 * 1000 });
  const afterExpiry = browser({ initialRecord: expired });
  assert.equal(afterExpiry.requests[0].session_id, 'uuid-test');
  assert.notEqual(afterExpiry.requests[0].session_id, 'old-session');
});
test('survives blocked storage and failed network requests', async () => {
  const page = browser({ storage: false, failFetch: true });
  page.handlers.click({ target: { closest: () => null }, clientX: 3, clientY: 4 });
  await Promise.resolve();
  assert.equal(page.requests.length, 2);
  assert.equal(page.requests[0].session_id, page.requests[1].session_id);
});
test('attaches the account site ID supplied by the embed snippet or demo URL', () => {
  const embedded = browser({ siteId: 'account-site-id' });
  assert.equal(embedded.requests[0].site_id, 'account-site-id');
  const demo = browser({ search: '?site_id=demo-account-id' });
  assert.equal(demo.requests[0].site_id, 'demo-account-id');
});
