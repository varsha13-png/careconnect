const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { protect, authorize, homeGuard } = require('../middleware/auth');

// All routes require auth
router.use(protect);
router.use(authorize('authority', 'care_worker'));

// @route GET /api/members/:homeId
// Get all members of a home
router.get('/:homeId', homeGuard, async (req, res) => {
  try {
    const filter = { home_id: req.params.homeId, status: 'active' };
    // Care workers only see basic info — not full medical history
    const select = req.user.role === 'care_worker'
      ? 'name age gender room_number special_needs medicines status'
      : '';
    const members = await Member.find(filter).select(select);
    res.json({ success: true, count: members.length, data: members });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route GET /api/members/:homeId/:memberId
// Get single member
router.get('/:homeId/:memberId', homeGuard, async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.params.memberId,
      home_id: req.params.homeId
    });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    // Care workers cannot see full medical history
    if (req.user.role === 'care_worker' && !req.user.permissions?.view_medical_history) {
      const { medical_history, emergency_contacts, ...safeData } = member._doc;
      return res.json({ success: true, data: safeData });
    }
    res.json({ success: true, data: member });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route POST /api/members/:homeId
// Add a new member — authority only
router.post('/:homeId', authorize('authority'), homeGuard, async (req, res) => {
  try {
    const member = await Member.create({ ...req.body, home_id: req.params.homeId });
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/members/:homeId/:memberId
// Update member — authority only
router.put('/:homeId/:memberId', authorize('authority'), homeGuard, async (req, res) => {
  try {
    const member = await Member.findOneAndUpdate(
      { _id: req.params.memberId, home_id: req.params.homeId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route DELETE /api/members/:homeId/:memberId
// Discharge a member — authority only
router.delete('/:homeId/:memberId', authorize('authority'), homeGuard, async (req, res) => {
  try {
    await Member.findOneAndUpdate(
      { _id: req.params.memberId, home_id: req.params.homeId },
      { status: 'discharged' }
    );
    res.json({ success: true, message: 'Member discharged' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
