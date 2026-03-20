const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  need_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Need' },
  home_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
  donor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
  type: {
    type: String,
    enum: ['money', 'items'],
    required: true
  },
  amount: Number,
  currency: { type: String, default: 'INR' },
  quantity: Number,
  item_name: String,
  item_brand: String,
  delivery_method: {
    type: String,
    enum: ['drop_off', 'courier', 'pickup']
  },
  payment_method: {
    type: String,
    enum: ['upi', 'card', 'net_banking']
  },
  payment_ref: String,
  razorpay_order_id: String,
  razorpay_payment_id: String,
  is_anonymous: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pledged', 'confirmed', 'delivered', 'cancelled'],
    default: 'pledged'
  },
  impact_update: String,
  impact_sent_at: Date,
  donated_at: { type: Date, default: Date.now },
  confirmed_at: Date
});

donationSchema.index({ need_id: 1, status: 1 });
donationSchema.index({ donor_id: 1, donated_at: -1 });
donationSchema.index({ home_id: 1, donated_at: -1 });
donationSchema.index({ status: 1, confirmed_at: 1 });

module.exports = mongoose.model('Donation', donationSchema);
