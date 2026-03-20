const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const User = require('../models/User');
const { protect, authorize, homeGuard } = require('../middleware/auth');

router.use(protect);
router.use(authorize('authority', 'care_worker'));

// @route GET /api/alerts/:homeId
// Get alerts for a home
router.get('/:homeId', homeGuard, async (req, res) => {
  try {
    const { status, type, date } = req.query;
    const filter = { home_id: req.params.homeId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.scheduled_at = { $gte: start, $lt: end };
    }
    const alerts = await Alert.find(filter)
      .populate('member_id', 'name age room_number')
      .populate('created_by', 'name role')
      .sort({ scheduled_at: 1 });
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route POST /api/alerts/:homeId
// Create alert — both authority and care_worker can create
router.post('/:homeId', homeGuard, async (req, res) => {
  try {
    const approval_status = req.user.role === 'care_worker' ? 'auto_approved' : 'auto_approved';
    const alert = await Alert.create({
      ...req.body,
      home_id: req.params.homeId,
      created_by: req.user._id,
      approval_status
    });
    // If created by care worker — notify authority
    if (req.user.role === 'care_worker') {
      // In production: send push notification to authority
      console.log(`Alert created by care worker — notifying authority of home ${req.params.homeId}`);
    }
    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/alerts/:homeId/:alertId/done
// Mark alert as done
router.put('/:homeId/:alertId/done', homeGuard, async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.alertId, home_id: req.params.homeId },
      { status: 'done', done_by: req.user._id, done_at: new Date() },
      { new: true }
    );
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/alerts/:homeId/:alertId/snooze
// Snooze alert
router.put('/:homeId/:alertId/snooze', homeGuard, async (req, res) => {
  try {
    const snoozeTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.alertId, home_id: req.params.homeId },
      { status: 'snoozed', snoozed_until: snoozeTime },
      { new: true }
    );
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/alerts/:homeId/:alertId/reject
// Reject alert (authority only — for care worker created alerts)
router.put('/:homeId/:alertId/reject', authorize('authority'), homeGuard, async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.alertId, home_id: req.params.homeId },
      {
        approval_status: 'rejected',
        status: 'missed',
        rejected_by: req.user._id,
        rejection_reason: req.body.reason
      },
      { new: true }
    );
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route DELETE /api/alerts/:homeId/:alertId
// Delete alert — authority only
router.delete('/:homeId/:alertId', authorize('authority'), homeGuard, async (req, res) => {
  try {
    await Alert.findOneAndDelete({ _id: req.params.alertId, home_id: req.params.homeId });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
