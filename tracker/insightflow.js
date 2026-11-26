(function insightFlowBootstrap(window, document) {
  'use strict';
  try {
    var script = document.currentScript || document.querySelector('script[data-api-url]');
    if (!script || window.__insightFlowLoaded) return;
    window.__insightFlowLoaded = true;
    var endpoint = script.getAttribute('data-api-url');
    if (!endpoint) return;
    var siteId = script.getAttribute('data-site-id') || '';
    if (!siteId) {
      try { siteId = new URLSearchParams(window.location.search || '').get('site_id') || ''; } catch (_) {}
    }
    var storageKey = 'insightflow_session' + (siteId ? ':' + siteId : '');
    var ttl = 30 * 60 * 1000;
    var memorySession = null;
    function makeId() {
      try { if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID(); } catch (_) {}
      return 'if-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }
    function sessionId() {
      var now = Date.now();
      try {
        var saved = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
        if (saved && typeof saved.id === 'string' && now - saved.lastSeen < ttl) {
          saved.lastSeen = now; window.localStorage.setItem(storageKey, JSON.stringify(saved)); return saved.id;
        }
        var next = { id: makeId(), lastSeen: now };
        window.localStorage.setItem(storageKey, JSON.stringify(next)); return next.id;
      } catch (_) {
        if (memorySession && now - memorySession.lastSeen < ttl) { memorySession.lastSeen = now; return memorySession.id; }
        memorySession = { id: makeId(), lastSeen: now };
        return memorySession.id;
      }
    }
    function send(type, properties) {
      try {
        var event = { session_id: sessionId(), event_type: type, page_url: window.location.href, timestamp: new Date().toISOString(), properties: properties || {} };
        if (siteId) event.site_id = siteId;
        var body = JSON.stringify(event);
        if (document.visibilityState === 'hidden' && navigator.sendBeacon) {
          try { if (navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain;charset=UTF-8' }))) return; } catch (_) {}
        }
        window.fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true, mode: 'cors' }).catch(function () {});
      } catch (_) { /* Tracking must never interrupt the host page. */ }
    }
    if (!window.__insightFlowPageViewSent) {
      window.__insightFlowPageViewSent = true;
      send('page_view', { title: (document.title || '').slice(0, 300) });
    }
    document.addEventListener('click', function (event) {
      try {
        var target = event.target && event.target.closest ? event.target.closest('[data-insightflow-ignore]') : null;
        if (target) return;
        send('click', { x: event.clientX, y: event.clientY, viewport_width: Math.max(1, window.innerWidth), viewport_height: Math.max(1, window.innerHeight) });
      } catch (_) {}
    }, { passive: true, capture: true });
  } catch (_) { /* SDK is deliberately fail-silent. */ }
})(window, document);
