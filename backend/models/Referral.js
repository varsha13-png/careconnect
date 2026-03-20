const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  home_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
  referred_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  person: {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone: String,
    address: String,
    condition: String,
    notes: String
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'admitted', 'declined'],
    default: 'pending'
  },
  home_response: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

referralSchema.index({ home_id: 1, status: 1 });
referralSchema.index({ referred_by: 1, created_at: -1 });

module.exports = mongoose.model('Referral', referralSchema);
