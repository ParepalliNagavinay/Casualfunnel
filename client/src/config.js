export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = new URL(API_BASE, window.location.origin).origin;
export const DEMO_URL = import.meta.env.VITE_DEMO_URL || `${API_ORIGIN}/demo/`;
export const TRACKER_URL = `${API_ORIGIN}/tracker/insightflow.js`;
export function demoUrlForTracker(trackerId) {
  const url = new URL(DEMO_URL);
  url.searchParams.set('site_id', trackerId);
  return url.toString();
}
