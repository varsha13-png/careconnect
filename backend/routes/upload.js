const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize, homeGuard } = require('../middleware/auth');
const Home = require('../models/Home');

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `./uploads/${req.params.type || 'general'}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files allowed'));
  }
});

// @route POST /api/upload/:type
// Upload any image (qr, profile, post)
router.post('/:type', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const url = `/uploads/${req.params.type}/${req.file.filename}`;

    // If uploading QR code — auto update home payment settings
    if (req.params.type === 'qr' && req.user.home_id) {
      await Home.findByIdAndUpdate(req.user.home_id, {
        'payment_settings.qr_code_url': url,
        'payment_settings.is_setup': true
      });
    }

    res.json({ success: true, data: { url } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
