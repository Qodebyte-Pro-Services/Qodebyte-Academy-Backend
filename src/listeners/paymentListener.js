const paymentEvents = require('../events/paymentEvents');
const { sendPaymentDefaultedEmail, sendPaymentReminderEmail } = require('../services/emailServices');



const throttleStore = {};

const MAX_EMAILS_PER_MIN = 3;
const WINDOW_MS = 60 * 1000;

function canSendEmail(email) {
  const now = Date.now();

  if (!throttleStore[email]) throttleStore[email] = [];

 
  throttleStore[email] = throttleStore[email].filter(ts => now - ts < WINDOW_MS);

  if (throttleStore[email].length >= MAX_EMAILS_PER_MIN) {
    console.log(`⛔ Email throttled for ${email}`);
    return false;
  }

  throttleStore[email].push(now);
  return true;
}



paymentEvents.on('payment:defaulted', async ({ email, courseTitle }) => {
  if (!canSendEmail(email)) return;

  try {
    await sendPaymentDefaultedEmail(email, courseTitle, 'defaulted');
    console.log(`📩 Defaulted email sent to ${email}`);
  } catch (err) {
    console.error('Defaulted email error:', err);
  }
});



paymentEvents.on('payment:reminder', async ({ email, courseTitle, dueDate }) => {
  if (!canSendEmail(email)) return;

  try {
    await sendPaymentReminderEmail(email, courseTitle, dueDate);
    console.log(`📩 Reminder email sent to ${email}`);
  } catch (err) {
    console.error('Reminder email error:', err);
  }
});