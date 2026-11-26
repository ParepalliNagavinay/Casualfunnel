import User from '../models/User.js';
import { hashSessionToken, readSessionCookie } from '../services/authService.js';

export async function requireAuth(req, res, next) {
  const token = readSessionCookie(req);
  if (!token) return res.status(401).json({ success: false, error: { message: 'Please sign in to continue.' } });
  try {
    const user = await User.findOne({ sessions: { $elemMatch: { token_hash: hashSessionToken(token), expires_at: { $gt: new Date() } } } });
    if (!user) return res.status(401).json({ success: false, error: { message: 'Your session has expired. Please sign in again.' } });
    req.user = user;
    next();
  } catch (error) { next(error); }
}
