const express = require('express');
const router = express.Router();
const Home = require('../models/Home');
const User = require('../models/User');
const crypto = require('crypto');
const { protect, authorize, homeGuard } = require('../middleware/auth');

// @route GET /api/homes/browse
// Public browse — for donors (no auth needed)
router.get('/browse', async (req, res) => {
  try {
    const { city, state, type } = req.query;
    const filter = {
      verification_status: { $in: ['level1', 'level2'] },
      visibility_percent: { $gt: 0 }
    };
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');
    if (type) filter.type = type;
    const homes = await Home.find(filter)
      .select('name type city locality_zone capacity current_occupancy verification_status contact_info.phone');
    res.json({ success: true, count: homes.length, data: homes });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route GET /api/homes/:homeId
// Get home details
router.get('/:homeId', async (req, res) => {
  try {
    const home = await Home.findById(req.params.homeId)
      .select('-payment_settings.bank_account -verification_documents');
    if (!home) return res.status(404).json({ success: false, message: 'Home not found' });
    res.json({ success: true, data: home });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/homes/:homeId/payment-settings
// Update payment settings — authority only
router.put('/:homeId/payment-settings', protect, authorize('authority'), homeGuard, async (req, res) => {
  try {
    const { upi_id, upi_mobile, qr_code_url, bank_account } = req.body;
    const home = await Home.findByIdAndUpdate(
      req.params.homeId,
      {
        payment_settings: {
          upi_id, upi_mobile, qr_code_url, bank_account,
          is_setup: !!(upi_id)
        }
      },
      { new: true }
    );
    res.json({ success: true, data: home.payment_settings });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/homes/:homeId/visibility
// Update visibility — authority only
router.put('/:homeId/visibility', protect, authorize('authority'), homeGuard, async (req, res) => {
  try {
    const home = await Home.findByIdAndUpdate(
      req.params.homeId,
      { visibility_percent: req.body.visibility_percent },
      { new: true }
    );
    res.json({ success: true, data: home });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route POST /api/homes/:homeId/invite-worker
// Invite care worker — authority only
router.post('/:homeId/invite-worker', protect, authorize('authority'), homeGuard, async (req, res) => {
  try {
    const { name, phone, designation, shift, working_days, responsibilities, language_preference, emergency_contact, permissions } = req.body;
    const invite_code = 'CC-' + Math.floor(1000 + Math.random() * 9000);
    const worker = await User.create({
      home_id: req.params.homeId,
      name, phone, designation, shift,
      working_days, responsibilities,
      language_preference, emergency_contact,
      permissions,
      role: 'care_worker',
      invite_code,
      invite_status: 'pending'
    });
    // In production: send SMS via Twilio
    console.log(`Invite code ${invite_code} sent to ${phone}`);
    res.status(201).json({ success: true, data: worker, invite_code });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route GET /api/homes/:homeId/workers
// Get all care workers — authority only
router.get('/:homeId/workers', protect, authorize('authority'), homeGuard, async (req, res) => {
  try {
    const workers = await User.find({
      home_id: req.params.homeId,
      role: 'care_worker'
    }).select('-password -invite_code');
    res.json({ success: true, data: workers });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route GET /api/homes/:homeId/dashboard
// Get dashboard summary — authority only
router.get('/:homeId/dashboard', protect, authorize('authority'), homeGuard, async (req, res) => {
  try {
    const Member = require('../models/Member');
    const Alert = require('../models/Alert');
    const Need = require('../models/Need');
    const Donation = require('../models/Donation');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [memberCount, alertsToday, openNeeds, recentDonations, workers] = await Promise.all([
      Member.countDocuments({ home_id: req.params.homeId, status: 'active' }),
      Alert.countDocuments({ home_id: req.params.homeId, scheduled_at: { $gte: today, $lt: tomorrow } }),
      Need.countDocuments({ home_id: req.params.homeId, status: { $in: ['open', 'partially_fulfilled'] } }),
      Donation.find({ home_id: req.params.homeId }).sort({ donated_at: -1 }).limit(5)
        .populate('donor_id', 'name').populate('need_id', 'item_name'),
      User.find({ home_id: req.params.homeId, role: 'care_worker', is_active: true })
        .select('name shift is_active')
    ]);

    res.json({
      success: true,
      data: { memberCount, alertsToday, openNeeds, recentDonations, workers }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route DELETE /api/homes/:homeId/workers/:workerId
// Remove a care worker
router.delete('/:homeId/workers/:workerId', protect, authorize('authority'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.workerId);
    res.json({ success: true, message: 'Care worker removed' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;