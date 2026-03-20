const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  home_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['medicine', 'checkup', 'vaccination', 'birthday', 'stock_refill'],
    required: true
  },
  title: { type: String, required: true },
  message: String,
  scheduled_at: { type: Date, required: true },
  recurrence: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'once'],
    default: 'once'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'snoozed', 'done', 'missed'],
    default: 'pending'
  },
  done_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  done_at: Date,
  snoozed_until: Date,
  notify_roles: [{ type: String, enum: ['authority', 'care_worker'] }],
  send_sms: { type: Boolean, default: false },
  approval_status: {
    type: String,
    enum: ['auto_approved', 'pending_review', 'rejected'],
    default: 'auto_approved'
  },
  rejected_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejection_reason: String,
  medicine_details: {
    name: String,
    dosage: String,
    time_slot: String
  },
  doctor_details: {
    name: String,
    notes: String
  },
  stock_details: {
    item_name: String,
    current_stock: Number,
    threshold: Number,
    category: String
  },
  created_at: { type: Date, default: Date.now }
});

alertSchema.index({ home_id: 1, scheduled_at: 1 });
alertSchema.index({ home_id: 1, status: 1, scheduled_at: 1 });
alertSchema.index({ member_id: 1, type: 1 });
alertSchema.index({ home_id: 1, type: 1, status: 1 });
alertSchema.index({ scheduled_at: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

module.exports = mongoose.model('Alert', alertSchema);
