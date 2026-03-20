const Alert = require('../models/Alert');
const Member = require('../models/Member');
const User = require('../models/User');
const { sendMedicineReminder } = require('./sms');

// Check and send due alerts every minute
const startAlertScheduler = () => {
  console.log('Alert scheduler started');

  setInterval(async () => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

      // Find alerts that are due and have SMS enabled
      const dueAlerts = await Alert.find({
        status: 'pending',
        send_sms: true,
        scheduled_at: { $gte: fiveMinutesAgo, $lte: now }
      }).populate('member_id', 'name').populate('home_id');

      for (const alert of dueAlerts) {
        if (alert.type === 'medicine' && alert.notify_roles?.includes('care_worker')) {
          // Get care workers for this home
          const careWorkers = await User.find({
            home_id: alert.home_id,
            role: 'care_worker',
            is_active: true,
            invite_status: 'accepted'
          }).select('phone name');

          for (const worker of careWorkers) {
            if (worker.phone) {
              await sendMedicineReminder(
                worker.phone,
                alert.member_id?.name || 'Member',
                alert.medicine_details?.name || alert.title,
                alert.medicine_details?.dosage || '',
                new Date(alert.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              );
            }
          }
        }
      }
    } catch (err) {
      console.error('Scheduler error:', err.message);
    }
  }, 60 * 1000); // every 60 seconds
};

module.exports = { startAlertScheduler };
