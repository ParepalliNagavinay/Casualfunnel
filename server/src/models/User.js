import mongoose from 'mongoose';

const loginSessionSchema = new mongoose.Schema({
  token_hash: { type: String, required: true },
  expires_at: { type: Date, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  password_hash: { type: String, required: true, select: false },
  tracker_id: { type: String, required: true, unique: true, immutable: true },
  sessions: { type: [loginSessionSchema], default: [], select: false },
  reset_token_hash: { type: String, default: null, select: false },
  reset_expires_at: { type: Date, default: null, select: false }
}, { timestamps: true, strict: 'throw' });

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'sessions.token_hash': 1 });
export default mongoose.model('User', userSchema);
