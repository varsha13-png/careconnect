const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['old_age_home', 'orphanage'],
    required: true
  },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  locality_zone: { type: String, required: true },
  capacity: { type: Number, required: true },
  current_occupancy: { type: Number, default: 0 },
  verification_status: {
    type: String,
    enum: ['pending', 'level1', 'level2', 'rejected'],
    default: 'pending'
  },
  verification_documents: [{
    name: String,
    url: String,
    uploaded_at: { type: Date, default: Date.now }
  }],
  visibility_percent: {
    type: Number,
    enum: [0, 25, 50, 75, 100],
    default: 25
  },
  contact_info: {
    phone: String,
    email: String,
    website: String
  },
  payment_settings: {
    upi_id: String,
    upi_mobile: String,
    qr_code_url: String,
    bank_account: String,
    is_setup: { type: Boolean, default: false }
  },
  established_year: Number,
  description: String,
  registered_at: { type: Date, default: Date.now }
});

homeSchema.index({ locality_zone: 1, verification_status: 1 });
homeSchema.index({ visibility_percent: 1, verification_status: 1 });
homeSchema.index({ 'contact_info.email': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Home', homeSchema);
