const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donor = require('../models/Donor');
const Home = require('../models/Home');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// @route POST /api/auth/register/home
// Register a new home + authority
router.post('/register/home', async (req, res) => {
  try {
    const {
      home_name, home_type, address, city, state, locality_zone, capacity,
      admin_name, admin_phone, admin_email, admin_designation, aadhaar_last4,
      verification_level, admin_password
    } = req.body;

    const home = await Home.create({
      name: home_name,
      type: home_type,
      address, city, state, locality_zone,
      capacity: Number(capacity),
      contact_info: { email: admin_email, phone: admin_phone },
      verification_status: 'pending'
    });

    const authority = await User.create({
      home_id: home._id,
      name: admin_name,
      phone: admin_phone,
      email: admin_email,
      designation: admin_designation,
      password: admin_password,
      role: 'authority',
      invite_status: 'accepted'
    });

    res.status(201).json({
      success: true,
      message: 'Home registration submitted. Pending review.',
      data: { home_id: home._id, user_id: authority._id }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route POST /api/auth/register/donor
// Register a new donor
router.post('/register/donor', async (req, res) => {
  try {
    const { name, phone, email, city, state, locality, thoughts, password } = req.body;
    const donor = await Donor.create({ name, phone, email, city, state, locality, thoughts, password });
    const token = donor.getSignedJwtToken();
    res.status(201).json({ success: true, token, data: donor });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route POST /api/auth/login
// Login for all users (authority, care_worker, govt_official)
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'Password is required' });
    const query = email ? { email } : { phone };
    const user = await User.findOne(query).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.password) return res.status(401).json({ success: false, message: 'Account not fully set up. Please use your invite code to join first.' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = user.getSignedJwtToken();
    const userData = user.toObject();
    delete userData.password;
    res.json({ success: true, token, data: userData });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route POST /api/auth/login/donor
// Login for donors
router.post('/login/donor', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const donor = await Donor.findOne({ phone }).select('+password');
    if (!donor || !(await donor.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = donor.getSignedJwtToken();
    const donorData = donor.toObject();
    delete donorData.password;
    donorData.role = 'donor';
    res.json({ success: true, token, data: donorData });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route POST /api/auth/invite/accept
// Care worker accepts invite
router.post('/invite/accept', async (req, res) => {
  try {
    const { invite_code, password, phone } = req.body;
    const user = await User.findOne({ invite_code, phone });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid invite code or phone number. Please check and try again.' });
    }
    user.password = password;
    user.invite_status = 'accepted';
    user.invite_code = undefined;
    await user.save();
    const token = user.getSignedJwtToken();
    const userData = user.toObject();
    delete userData.password;
    res.json({ success: true, token, data: userData });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;