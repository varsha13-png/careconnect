const express = require('express');
const router = express.Router();
const Need = require('../models/Need');
const Donation = require('../models/Donation');
const Donor = require('../models/Donor');
const { protect, authorize, homeGuard } = require('../middleware/auth');

// ─── NEEDS ────────────────────────────────────────────────

// @route GET /api/needs/public
// Public needs — for donors to browse (no auth needed)
router.get('/public', async (req, res) => {
  try {
    const { city, category, urgency } = req.query;
    const filter = { is_public: true, status: { $in: ['open', 'partially_fulfilled'] } };
    if (category) filter.category = category;
    if (urgency) filter.urgency = urgency;
    const needs = await Need.find(filter)
      .populate('home_id', 'name city locality_zone verification_status type')
      .sort({ urgency: -1, created_at: -1 });
    res.json({ success: true, count: needs.length, data: needs });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route GET /api/needs/:homeId
// Get all needs of a home — authority/care_worker
router.get('/:homeId', protect, homeGuard, async (req, res) => {
  try {
    const needs = await Need.find({ home_id: req.params.homeId })
      .sort({ urgency: -1, created_at: -1 });
    res.json({ success: true, count: needs.length, data: needs });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route POST /api/needs/:homeId
// Create a need — authority only
router.post('/:homeId', protect, authorize('authority'), homeGuard, async (req, res) => {
  try {
    const need = await Need.create({ ...req.body, home_id: req.params.homeId });
    res.status(201).json({ success: true, data: need });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/needs/:homeId/:needId
// Update a need — authority only
router.put('/:homeId/:needId', protect, authorize('authority'), homeGuard, async (req, res) => {
  try {
    const need = await Need.findOneAndUpdate(
      { _id: req.params.needId, home_id: req.params.homeId },
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: need });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DONATIONS ────────────────────────────────────────────

// @route POST /api/needs/donate/:needId
// Create a donation — donor only
router.post('/donate/:needId', protect, authorize('donor'), async (req, res) => {
  try {
    const need = await Need.findById(req.params.needId);
    if (!need) return res.status(404).json({ success: false, message: 'Need not found' });

    const donation = await Donation.create({
      ...req.body,
      need_id: req.params.needId,
      home_id: need.home_id,
      donor_id: req.user._id
    });

    // Update need fulfillment
    if (req.body.type === 'money' && req.body.amount) {
      need.quantity_fulfilled = Math.min(
        need.quantity_fulfilled + 1,
        need.quantity_required
      );
      await need.save();
    }

    // Add to donor's history
    await Donor.findByIdAndUpdate(req.user._id, {
      $push: { donation_ids: donation._id }
    });

    res.status(201).json({ success: true, data: donation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route GET /api/needs/donations/:homeId
// Get donations for a home — authority only
router.get('/donations/:homeId', protect, authorize('authority', 'govt_official'), homeGuard, async (req, res) => {
  try {
    const donations = await Donation.find({ home_id: req.params.homeId })
      .populate('need_id', 'item_name category')
      .populate('donor_id', 'name')
      .sort({ donated_at: -1 });
    res.json({ success: true, count: donations.length, data: donations });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/needs/donations/:donationId/confirm
// Confirm donation received — authority only
router.put('/donations/:donationId/confirm', protect, authorize('authority'), async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.donationId,
      { status: 'confirmed', confirmed_at: new Date() },
      { new: true }
    );
    res.json({ success: true, data: donation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/needs/donations/:donationId/thanks
// Send impact message — authority only
router.put('/donations/:donationId/thanks', protect, authorize('authority'), async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.donationId,
      { impact_update: req.body.message, impact_sent_at: new Date() },
      { new: true }
    );
    res.json({ success: true, data: donation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route GET /api/needs/donations/my
// Get donor's own donation history
router.get('/donations/my/history', protect, authorize('donor'), async (req, res) => {
  try {
    const donations = await Donation.find({ donor_id: req.user._id })
      .populate('need_id', 'item_name category')
      .populate('home_id', 'name city')
      .sort({ donated_at: -1 });
    res.json({ success: true, data: donations });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
