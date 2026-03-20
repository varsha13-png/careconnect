const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Donation = require('../models/Donation');
const Need = require('../models/Need');
const { protect, authorize } = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route POST /api/payments/create-order
// Create a Razorpay order
router.post('/create-order', protect, authorize('donor'), async (req, res) => {
  try {
    const { amount, need_id, home_id } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        need_id: need_id || '',
        home_id: home_id || '',
        donor_id: req.user._id.toString()
      }
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, data: { order_id: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID } });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
});

// @route POST /api/payments/verify
// Verify payment after success
router.post('/verify', protect, authorize('donor'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, need_id, home_id, amount, is_anonymous } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Create confirmed donation
    const donation = await Donation.create({
      need_id,
      home_id,
      donor_id: req.user._id,
      type: 'money',
      amount,
      currency: 'INR',
      payment_method: 'upi',
      razorpay_order_id,
      razorpay_payment_id,
      is_anonymous: is_anonymous || false,
      status: 'confirmed',
      confirmed_at: new Date()
    });

    // Update need fulfillment
    if (need_id) {
      await Need.findByIdAndUpdate(need_id, { $inc: { quantity_fulfilled: 1 } });
    }

    res.json({ success: true, data: donation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
