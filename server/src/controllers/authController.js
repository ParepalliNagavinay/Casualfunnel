import User from '../models/User.js';
import * as auth from '../services/authService.js';

const validName = (name) => typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 80;
const validEmail = (email) => auth.isValidEmail(auth.normalizeEmail(email));
const badRequest = (res, message) => res.status(400).json({ success: false, error: { message } });
const success = (res, data, status = 200) => res.status(status).json({ success: true, data });

export async function register(req, res, next) {
  const { name, email, password } = req.body || {};
  if (!validName(name)) return badRequest(res, 'Name must be between 2 and 80 characters.');
  if (!validEmail(email)) return badRequest(res, 'Enter a valid email address.');
  const passwordError = auth.validatePassword(password);
  if (passwordError) return badRequest(res, passwordError);
  try {
    const user = await auth.registerAccount({ name, email, password });
    const token = await auth.startSession(user);
    auth.setSessionCookie(res, token);
    return success(res, { user: auth.publicUser(user) }, 201);
  } catch (error) { if (error.code === 11000) return res.status(409).json({ success: false, error: { message: 'An account with this email already exists.' } }); next(error); }
}

export async function login(req, res, next) {
  const email = auth.normalizeEmail(req.body?.email), password = req.body?.password;
  if (!validEmail(email) || typeof password !== 'string' || password.length > 128) return res.status(401).json({ success: false, error: { message: 'Email or password is incorrect.' } });
  try {
    const user = await User.findOne({ email }).select('+password_hash +sessions');
    if (!user || !(await auth.verifyPassword(password, user.password_hash))) return res.status(401).json({ success: false, error: { message: 'Email or password is incorrect.' } });
    const token = await auth.startSession(user);
    auth.setSessionCookie(res, token);
    return success(res, { user: auth.publicUser(user) });
  } catch (error) { next(error); }
}

export async function logout(req, res, next) {
  try { await auth.endSession(req); auth.clearSessionCookie(res); return success(res, { message: 'Signed out.' }); } catch (error) { next(error); }
}

export function me(req, res) { return success(res, { user: auth.publicUser(req.user) }); }

export async function forgotPassword(req, res, next) {
  const email = auth.normalizeEmail(req.body?.email);
  if (!validEmail(email)) return badRequest(res, 'Enter a valid email address.');
  try {
    await auth.requestPasswordReset(email);
    return res.status(202).json({ success: true, data: { message: 'If an account exists for that email, password reset instructions will be sent.' } });
  } catch (error) {
    console.error(`Password reset delivery failed: ${error.message}`);
    return res.status(202).json({ success: true, data: { message: 'If an account exists for that email, password reset instructions will be sent.' } });
  }
}

export async function resetPassword(req, res, next) {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) return badRequest(res, 'This reset link is invalid or has expired. Request a new one.');
  const passwordError = auth.validatePassword(password);
  if (passwordError) return badRequest(res, passwordError);
  try {
    const updated = await auth.resetPassword(token, password);
    if (!updated) return res.status(400).json({ success: false, error: { message: 'This reset link is invalid or has expired. Request a new one.' } });
    auth.clearSessionCookie(res);
    return success(res, { message: 'Password updated. Sign in with your new password.' });
  } catch (error) { next(error); }
}

export async function updateProfile(req, res, next) {
  const { name, current_password: currentPassword, new_password: newPassword } = req.body || {};
  if (!validName(name)) return badRequest(res, 'Name must be between 2 and 80 characters.');
  try {
    if (newPassword !== undefined && newPassword !== '') {
      const passwordError = auth.validatePassword(newPassword);
      if (passwordError) return badRequest(res, passwordError);
      const user = await User.findById(req.user._id).select('+password_hash +sessions');
      if (!currentPassword || !(await auth.verifyPassword(currentPassword, user.password_hash))) return res.status(400).json({ success: false, error: { message: 'Current password is incorrect.' } });
      user.password_hash = await auth.hashPassword(newPassword);
      user.name = name.trim();
      const currentSessionHash = auth.hashSessionToken(auth.readSessionCookie(req) || '');
      user.sessions = user.sessions.filter((session) => session.token_hash === currentSessionHash);
      await user.save();
      return success(res, { user: auth.publicUser(user) });
    }
    req.user.name = name.trim();
    await req.user.save();
    return success(res, { user: auth.publicUser(req.user) });
  } catch (error) { next(error); }
}
