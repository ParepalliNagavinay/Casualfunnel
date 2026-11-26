import * as service from '../services/eventService.js';
import { validateEvent } from '../validators/event.js';
import mongoose from 'mongoose';

export async function ingest(req, res, next) {
  const error = validateEvent(req.body);
  if (error) return res.status(400).json({ success: false, error: { message: error } });
  try { const event = await service.createEvent(req.body); return res.status(201).json({ success: true, data: { id: event.id } }); } catch (err) { next(err); }
}
export async function sessions(req, res, next) { try { res.json({ success: true, data: await service.listSessions(req.user._id, req.query) }); } catch (e) { next(e); } }
export async function sessionEvents(req, res, next) { try { const data = await service.getSessionEvents(req.user._id, req.params.sessionId, req.query); res.json({ success: true, data }); } catch (e) { next(e); } }
export async function heatmap(req, res, next) { if (typeof req.query.page_url === 'string' && req.query.page_url.length > 2048) return res.status(400).json({ success: false, error: { message: 'page_url is too long.' } }); try { res.json({ success: true, data: await service.getHeatmap(req.user._id, req.query.page_url) }); } catch (e) { next(e); } }
export async function overview(req, res, next) { try { res.json({ success: true, data: await service.getOverview(req.user._id) }); } catch (e) { next(e); } }
export async function health(req, res) { const ready = mongoose.connection.readyState === 1; res.status(ready ? 200 : 503).json({ success: ready, data: { status: ready ? 'ok' : 'degraded', database: ready ? 'connected' : 'disconnected' } }); }
