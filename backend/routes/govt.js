const express = require('express');
const router = express.Router();
const Home = require('../models/Home');
const Member = require('../models/Member');
const Need = require('../models/Need');
const Donation = require('../models/Donation');
const Referral = require('../models/Referral');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('govt_official'));

// @route GET /api/govt/overview
// Platform wide stats
router.get('/overview', async (req, res) => {
  try {
    const [totalHomes, pendingHomes, totalMembers, openNeeds, totalDonations, referrals] = await Promise.all([
      Home.countDocuments({ verification_status: { $in: ['level1', 'level2'] } }),
      Home.countDocuments({ verification_status: 'pending' }),
      Member.countDocuments({ status: 'active' }),
      Need.countDocuments({ status: { $in: ['open', 'partially_fulfilled'] } }),
      Donation.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Referral.countDocuments({ status: 'pending' })
    ]);
    res.json({
      success: true,
      data: {
        totalHomes,
        pendingHomes,
        totalMembers,
        openNeeds,
        totalDonations: totalDonations[0]?.total || 0,
        pendingReferrals: referrals
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route GET /api/govt/homes
// All homes with details
router.get('/homes', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { verification_status: status } : {};
    const homes = await Home.find(filter).sort({ registered_at: -1 });
    res.json({ success: true, count: homes.length, data: homes });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/govt/homes/:homeId/verify
// Approve or reject a home verification
router.put('/homes/:homeId/verify', async (req, res) => {
  try {
    const { status, reason } = req.body;
    const home = await Home.findByIdAndUpdate(
      req.params.homeId,
      { verification_status: status },
      { new: true }
    );
    res.json({ success: true, data: home });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route GET /api/govt/referrals
// Get all referrals made by this official
router.get('/referrals', async (req, res) => {
  try {
    const referrals = await Referral.find({ referred_by: req.user._id })
      .populate('home_id', 'name city type verification_status')
      .sort({ created_at: -1 });
    res.json({ success: true, data: referrals });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route POST /api/govt/referrals
// Create a new referral
router.post('/referrals', async (req, res) => {
  try {
    const referral = await Referral.create({
      ...req.body,
      referred_by: req.user._id
    });
    const populated = await Referral.findById(referral._id)
      .populate('home_id', 'name city type');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/govt/referrals/:referralId
// Update referral status
router.put('/referrals/:referralId', async (req, res) => {
  try {
    const referral = await Referral.findByIdAndUpdate(
      req.params.referralId,
      { ...req.body, updated_at: new Date() },
      { new: true }
    ).populate('home_id', 'name city');
    res.json({ success: true, data: referral });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route GET /api/govt/homes/:homeId/referrals
// Get referrals for a specific home (home authority can see these)
router.get('/homes/:homeId/referrals', async (req, res) => {
  try {
    const referrals = await Referral.find({ home_id: req.params.homeId })
      .populate('referred_by', 'name designation')
      .sort({ created_at: -1 });
    res.json({ success: true, data: referrals });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
