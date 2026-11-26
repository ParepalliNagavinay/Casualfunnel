const allowedKeys = new Set(['session_id', 'event_type', 'page_url', 'timestamp', 'properties', 'site_id']);

export function validateEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Body must be a JSON object.';
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) return 'Payload contains unsupported fields.';
  if (typeof body.session_id !== 'string' || !body.session_id.trim() || body.session_id.length > 128) return 'session_id must be a non-empty string up to 128 characters.';
  if (body.site_id !== undefined && (typeof body.site_id !== 'string' || !body.site_id.trim() || body.site_id.length > 128)) return 'site_id must be a non-empty string up to 128 characters.';
  if (!['page_view', 'click'].includes(body.event_type)) return 'event_type must be page_view or click.';
  if (typeof body.page_url !== 'string' || body.page_url.length > 2048) return 'page_url must be a URL up to 2048 characters.';
  try { const url = new URL(body.page_url); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); } catch { return 'page_url must be a valid HTTP or HTTPS URL.'; }
  if (typeof body.timestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(body.timestamp) || !Number.isFinite(Date.parse(body.timestamp))) return 'timestamp must be a valid ISO 8601 date string.';
  const p = body.properties ?? {};
  if (typeof p !== 'object' || Array.isArray(p)) return 'properties must be an object.';
  if (Object.keys(p).some((key) => !['x', 'y', 'viewport_width', 'viewport_height', 'title'].includes(key))) return 'properties contains unsupported fields.';
  if (body.event_type === 'click') {
    for (const key of ['x', 'y']) if (!Number.isFinite(p[key]) || p[key] < 0) return `properties.${key} must be a non-negative number.`;
    for (const key of ['viewport_width', 'viewport_height']) if (!Number.isFinite(p[key]) || p[key] <= 0) return `properties.${key} must be a positive number.`;
    if (p.x > p.viewport_width || p.y > p.viewport_height) return 'Click coordinates must fall within the recorded viewport.';
  }
  if (p.title !== undefined && (typeof p.title !== 'string' || p.title.length > 300)) return 'properties.title must be a string up to 300 characters.';
  return null;
}
