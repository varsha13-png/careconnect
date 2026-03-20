const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  home_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Home' },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, minlength: 6 },
  role: {
    type: String,
    enum: ['authority', 'care_worker', 'donor', 'govt_official'],
    required: true
  },
  designation: String,
  shift: {
    type: String,
    enum: ['morning', 'night', 'fulltime']
  },
  working_days: [String],
  responsibilities: [String],
  language_preference: { type: String, default: 'english' },
  emergency_contact: {
    name: String,
    relation: String,
    phone: String
  },
  permissions: {
    view_alerts: { type: Boolean, default: true },
    mark_alerts_done: { type: Boolean, default: true },
    view_resident_diet: { type: Boolean, default: true },
    view_medical_history: { type: Boolean, default: false },
    manage_needs: { type: Boolean, default: false }
  },
  is_active: { type: Boolean, default: true },
  invite_code: String,
  invite_status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending'
  },
  created_at: { type: Date, default: Date.now }
});

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ home_id: 1, role: 1 });
userSchema.index({ home_id: 1, is_active: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, home_id: this.home_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = mongoose.model('User', userSchema);
