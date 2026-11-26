import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, error: { message: 'Too many sign-in attempts. Try again in 15 minutes.' } } });
const accountLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false });
router.post('/signup', accountLimit, controller.register);
router.post('/login', loginLimit, controller.login);
router.post('/logout', controller.logout);
router.post('/forgot-password', accountLimit, controller.forgotPassword);
router.post('/reset-password', accountLimit, controller.resetPassword);
router.get('/me', requireAuth, controller.me);
router.patch('/profile', requireAuth, controller.updateProfile);
export default router;
