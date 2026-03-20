const twilio = require('twilio');

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const sendSMS = async (to, message) => {
  if (!client) {
    console.log(`[SMS MOCK] To: ${to} | Message: ${message}`);
    return { success: true, mock: true };
  }
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${to}`
    });
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error('SMS error:', err.message);
    return { success: false, error: err.message };
  }
};

// Send medicine reminder SMS
const sendMedicineReminder = async (phone, memberName, medicineName, dosage, time) => {
  const message = `Care Connect Reminder: ${memberName} needs to take ${medicineName} (${dosage}) at ${time}. Please ensure this is administered. - Care Connect`;
  return sendSMS(phone, message);
};

// Send care worker invite SMS
const sendInviteSMS = async (phone, workerName, homeName, inviteCode) => {
  const message = `Hi ${workerName}! You've been invited to join ${homeName} on Care Connect. Your invite code is: ${inviteCode}. Download the app and use this code to join. - Care Connect`;
  return sendSMS(phone, message);
};

// Send donation confirmation SMS to donor
const sendDonationConfirmation = async (phone, donorName, homeName, amount) => {
  const message = `Hi ${donorName}! Your donation of Rs.${amount} to ${homeName} has been confirmed. Thank you for making a difference! - Care Connect`;
  return sendSMS(phone, message);
};

// Send donation received alert to home authority
const sendDonationAlert = async (phone, homeName, donorName, needName, amount) => {
  const message = `Care Connect: New donation received! ${donorName} donated Rs.${amount} for "${needName}" at ${homeName}. Login to confirm receipt. - Care Connect`;
  return sendSMS(phone, message);
};

module.exports = { sendSMS, sendMedicineReminder, sendInviteSMS, sendDonationConfirmation, sendDonationAlert };
