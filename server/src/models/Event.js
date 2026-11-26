import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  session_id: { type: String, required: true, trim: true, maxlength: 128 },
  event_type: { type: String, required: true, enum: ['page_view', 'click'] },
  page_url: { type: String, required: true, maxlength: 2048 },
  timestamp: { type: Date, required: true },
  properties: {
    x: { type: Number, min: 0 }, y: { type: Number, min: 0 },
    viewport_width: { type: Number, min: 1 }, viewport_height: { type: Number, min: 1 },
    title: { type: String, maxlength: 300 }
  }
}, { timestamps: { createdAt: true, updatedAt: false }, strict: 'throw' });

eventSchema.index({ account_id: 1, session_id: 1, timestamp: 1 });
eventSchema.index({ account_id: 1, timestamp: -1 });
eventSchema.index({ account_id: 1, page_url: 1, event_type: 1, timestamp: -1 });
export default mongoose.model('Event', eventSchema);
