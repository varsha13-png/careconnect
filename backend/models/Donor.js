const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const donorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, minlength: 6 },
  city: String,
  state: String,
  locality: String,
  thoughts: String,
  kyc_status: {
    type: String,
    enum: ['none', 'basic', 'verified'],
    default: 'none'
  },
  donation_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donation' }],
  is_active: { type: Boolean, default: true },
  registered_at: { type: Date, default: Date.now }
});

donorSchema.index({ email: 1 }, { unique: true, sparse: true });
donorSchema.index({ kyc_status: 1 });

donorSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

donorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

donorSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: 'donor' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = mongoose.model('Donor', donorSchema);
