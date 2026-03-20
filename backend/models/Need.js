const mongoose = require('mongoose');

const needSchema = new mongoose.Schema({
  home_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
  item_name: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['medicine', 'grocery', 'clothing', 'education', 'financial', 'volunteer'],
    required: true
  },
  quantity_required: { type: Number, required: true },
  quantity_fulfilled: { type: Number, default: 0 },
  unit: { type: String, default: 'units' },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'partially_fulfilled', 'fulfilled', 'closed'],
    default: 'open'
  },
  is_public: { type: Boolean, default: true },
  expires_at: Date,
  created_at: { type: Date, default: Date.now }
});

needSchema.index({ home_id: 1, status: 1, urgency: -1 });
needSchema.index({ home_id: 1, category: 1, status: 1 });
needSchema.index({ is_public: 1, status: 1, urgency: -1 });
needSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Auto update status based on fulfillment
needSchema.pre('save', function (next) {
  if (this.quantity_fulfilled >= this.quantity_required) {
    this.status = 'fulfilled';
  } else if (this.quantity_fulfilled > 0) {
    this.status = 'partially_fulfilled';
  }
  next();
});

module.exports = mongoose.model('Need', needSchema);
