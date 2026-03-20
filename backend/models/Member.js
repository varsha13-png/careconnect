const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  home_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  room_number: String,
  admission_date: { type: Date, default: Date.now },
  medical_history: [String],
  medicines: [{
    name: { type: String, required: true },
    dosage: String,
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'once'],
      default: 'daily'
    },
    time_slots: [{
      time: String,
      dose: String
    }],
    start_date: Date,
    end_date: Date,
    notes: String
  }],
  emergency_contacts: [{
    name: String,
    relation: String,
    phone: String
  }],
  special_needs: {
    disability: String,
    mental_health: String,
    dietary: String,
    other: String
  },
  status: {
    type: String,
    enum: ['active', 'discharged', 'deceased'],
    default: 'active'
  },
  created_at: { type: Date, default: Date.now }
});

memberSchema.index({ home_id: 1, status: 1 });
memberSchema.index({ home_id: 1, 'medicines.time_slots.time': 1 });

module.exports = mongoose.model('Member', memberSchema);
