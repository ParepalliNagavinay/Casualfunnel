import { promisify } from 'node:util';
import { randomBytes, randomUUID, scrypt as scryptCallback, createHash, timingSafeEqual } from 'node:crypto';
import User from '../models/User.js';

const scrypt = promisify(scryptCallback);
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
const RESET_DURATION = 30 * 60 * 1000;
const SESSION_COOKIE = 'insightflow_session';

export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 12 && password.length <= 128
    ? null : 'Password must be between 12 and 128 characters.';
}

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  try {
    const [algorithm, salt, keyHex] = storedHash.split('$');
    if (algorithm !== 'scrypt' || !salt || !keyHex) return false;
    const expected = Buffer.from(keyHex, 'hex');
    const actual = await scrypt(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

export function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, tracker_id: user.tracker_id };
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function readSessionCookie(req) {
  const cookieHeader = req.headers.cookie || '';
  const prefix = `${SESSION_COOKIE}=`;
  const cookie = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  if (!cookie) return null;
  try { return decodeURIComponent(cookie.slice(prefix.length)); } catch { return null; }
}

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
    maxAge: SESSION_DURATION, path: '/api'
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api' });
}

export async function registerAccount({ name, email, password }) {
  const user = await User.create({ name: name.trim(), email: normalizeEmail(email), password_hash: await hashPassword(password), tracker_id: randomUUID() });
  return user;
}

export async function startSession(user) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  user.sessions = [...(user.sessions || []).filter((session) => session.expires_at > now), { token_hash: hashSessionToken(token), expires_at: new Date(now.getTime() + SESSION_DURATION) }];
  await user.save();
  return token;
}

export async function endSession(req) {
  const token = readSessionCookie(req);
  if (!token) return;
  await User.updateOne({ 'sessions.token_hash': hashSessionToken(token) }, { $pull: { sessions: { token_hash: hashSessionToken(token) } } });
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+reset_token_hash +reset_expires_at');
  if (!user) return;
  const token = randomBytes(32).toString('base64url');
  user.reset_token_hash = hashSessionToken(token);
  user.reset_expires_at = new Date(Date.now() + RESET_DURATION);
  await user.save();
  const origin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === 'production') throw new Error('Password reset email is not configured.');
    console.info(`[InsightFlow development] Password reset link for ${user.email}: ${resetUrl}`);
    return;
  }
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Reset your InsightFlow password',
      text: `Use this link to reset your password. It expires in 30 minutes.\n\n${resetUrl}`
    });
  } catch (error) {
    user.reset_token_hash = null;
    user.reset_expires_at = null;
    await user.save();
    throw error;
  }
}

export async function resetPassword(token, password) {
  const tokenHash = hashSessionToken(token);
  const user = await User.findOne({ reset_token_hash: tokenHash, reset_expires_at: { $gt: new Date() } }).select('+reset_token_hash +reset_expires_at +sessions');
  if (!user) return false;
  user.password_hash = await hashPassword(password);
  user.reset_token_hash = null;
  user.reset_expires_at = null;
  user.sessions = [];
  await user.save();
  return true;
}

export { SESSION_COOKIE, SESSION_DURATION };
