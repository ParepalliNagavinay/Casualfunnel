import Event from '../models/Event.js';
import User from '../models/User.js';

export async function createEvent(payload) {
  let accountId = null;
  if (payload.site_id) {
    const owner = await User.findOne({ tracker_id: payload.site_id }).select('_id').lean();
    if (!owner) { const error = new Error('Unknown site_id. Copy the tracker snippet from account settings.'); error.status = 400; throw error; }
    accountId = owner._id;
  }
  const properties = payload.event_type === 'click'
    ? Object.fromEntries(['x', 'y', 'viewport_width', 'viewport_height'].map((key) => [key, payload.properties[key]]))
    : Object.fromEntries(Object.entries(payload.properties ?? {}).filter(([key]) => key === 'title'));
  return Event.create({ account_id: accountId, session_id: payload.session_id.trim(), event_type: payload.event_type, page_url: payload.page_url, timestamp: new Date(payload.timestamp), properties });
}

export async function listSessions(accountId, { page = 1, limit = 20, sort = 'last_event_at', order = 'desc', search = '' }) {
  const safePage = Math.max(1, Number(page) || 1), safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const sortFields = { last_event_at: 'last_event_at', first_event_at: 'first_event_at', total_events: 'total_events' };
  const sortKey = sortFields[sort] ?? sortFields.last_event_at, direction = order === 'asc' ? 1 : -1;
  const pipeline = [
    { $match: { account_id: accountId } },
    { $group: { _id: '$session_id', total_events: { $sum: 1 }, page_views: { $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] } }, clicks: { $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] } }, first_event_at: { $min: '$timestamp' }, last_event_at: { $max: '$timestamp' } } },
    ...(search ? [{ $match: { _id: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } } }] : []),
    { $facet: { metadata: [{ $count: 'total' }], sessions: [{ $sort: { [sortKey]: direction, _id: 1 } }, { $skip: (safePage - 1) * safeLimit }, { $limit: safeLimit }, { $project: { _id: 0, session_id: '$_id', total_events: 1, page_views: 1, clicks: 1, first_event_at: 1, last_event_at: 1 } }] } }
  ];
  const [result] = await Event.aggregate(pipeline).allowDiskUse(true);
  return { sessions: result?.sessions ?? [], total: result?.metadata?.[0]?.total ?? 0, page: safePage, limit: safeLimit };
}

export async function getSessionEvents(accountId, sessionId, { page = 1, limit = 100 }) {
  const safePage = Math.max(1, Number(page) || 1), safeLimit = Math.min(500, Math.max(1, Number(limit) || 100));
  const filter = { account_id: accountId, session_id: sessionId };
  const [events, total] = await Promise.all([Event.find(filter).sort({ timestamp: 1, _id: 1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(), Event.countDocuments(filter)]);
  return { events, total, page: safePage, limit: safeLimit };
}

export async function getHeatmap(accountId, pageUrl) {
  const pages = pageUrl ? undefined : await Event.distinct('page_url', { account_id: accountId, event_type: 'click' });
  if (!pageUrl) return { page_url: null, total_clicks: 0, clicks: [], pages };
  const filter = { account_id: accountId, event_type: 'click', page_url: pageUrl };
  const [totalClicks, events] = await Promise.all([
    Event.countDocuments(filter),
    Event.find(filter).sort({ timestamp: -1, _id: -1 }).limit(5000).select('session_id timestamp properties').lean()
  ]);
  const clicks = events.map((event) => ({ x: event.properties.x, y: event.properties.y, viewport_width: event.properties.viewport_width, viewport_height: event.properties.viewport_height, timestamp: event.timestamp, session_id: event.session_id }));
  return { page_url: pageUrl, total_clicks: totalClicks, clicks, clicks_truncated: totalClicks > clicks.length };
}

export async function getOverview(accountId) {
  const [summary] = await Event.aggregate([{ $match: { account_id: accountId } }, { $group: { _id: null, total_events: { $sum: 1 }, total_sessions: { $addToSet: '$session_id' }, page_views: { $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] } }, clicks: { $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] } } } }]);
  const [daily, topPages, recent] = await Promise.all([
    Event.aggregate([{ $match: { account_id: accountId, timestamp: { $gte: new Date(Date.now() - 13 * 86400000) } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, events: { $sum: 1 }, sessions: { $addToSet: '$session_id' } } }, { $project: { date: '$_id', events: 1, sessions: { $size: '$sessions' }, _id: 0 } }, { $sort: { date: 1 } }]),
    Event.aggregate([{ $match: { account_id: accountId } }, { $group: { _id: '$page_url', events: { $sum: 1 }, sessions: { $addToSet: '$session_id' } } }, { $project: { page_url: '$_id', events: 1, sessions: { $size: '$sessions' }, _id: 0 } }, { $sort: { events: -1 } }, { $limit: 5 }]),
    Event.find({ account_id: accountId }).sort({ timestamp: -1 }).limit(8).select('session_id event_type page_url timestamp').lean()
  ]);
  return { total_sessions: summary?.total_sessions.length ?? 0, total_events: summary?.total_events ?? 0, page_views: summary?.page_views ?? 0, clicks: summary?.clicks ?? 0, daily, top_pages: topPages, recent };
}
