const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Donor = require('../models/Donor');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'donor') {
      req.user = await Donor.findById(decoded.id);
    } else {
      req.user = await User.findById(decoded.id);
    }
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user.role = decoded.role;
    req.user.home_id = decoded.home_id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`
      });
    }
    next();
  };
};

// Ensure user can only access their own home's data
exports.homeGuard = (req, res, next) => {
  const homeId = req.params.homeId || req.body.home_id;
  if (req.user.role === 'govt_official') return next();
  if (req.user.role === 'donor') return next();
  if (homeId && req.user.home_id && homeId !== req.user.home_id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own home data'
    });
  }
  next();
};
