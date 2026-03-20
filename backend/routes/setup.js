const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route POST /api/setup/govt
// Create a govt user quickly - only works if no govt user exists
router.get('/govt', async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'govt_official' });
    if (existing) {
      return res.json({ success: false, message: 'Govt user already exists. Phone: ' + existing.phone });
    }
    const user = new User({
      name: 'Test Official',
      phone: '9000000001',
      role: 'govt_official',
      designation: 'District Collector',
      invite_status: 'accepted'
    });
    user.password = 'test1234';
    await user.save();
    res.json({ success: true, message: 'Done! Login with phone: 9000000001 and password: test1234' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/govt', async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'govt_official' });
    if (existing) {
      return res.json({ success: false, message: 'Govt user already exists. Phone: ' + existing.phone });
    }
    const user = new User({
      name: req.body.name || 'Test Official',
      phone: req.body.phone || '9000000001',
      role: 'govt_official',
      designation: req.body.designation || 'District Collector',
      invite_status: 'accepted'
    });
    user.password = req.body.password || 'test1234';
    await user.save();
    res.json({ success: true, message: `Done! Login with phone: ${user.phone} password: ${req.body.password || 'test1234'}` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;