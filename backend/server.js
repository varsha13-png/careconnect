const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors({
  origin: '*',
  credentials: true
}));

// Static files
app.use('/uploads', express.static('uploads'));

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/homes', require('./routes/homes'));
app.use('/api/members', require('./routes/members'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/needs', require('./routes/needs'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/govt', require('./routes/govt'));
app.use('/api/setup', require('./routes/setup'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Care Connect API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Care Connect API running on port ${PORT}`);

  // Start alert scheduler for SMS reminders
  try {
    const { startAlertScheduler } = require('./services/scheduler');
    startAlertScheduler();
  } catch (err) {
    console.log('Scheduler not started:', err.message);
  }
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
