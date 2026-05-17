const express = require('express');
const router = express.Router();
const { checkAndSendReminders, updateDoseStatuses, sendEmail } = require('../services/reminderService');

// Accept the secret in header `x-cron-secret` OR query param `?secret=` (cron-job.org makes either easy)
function requireCronSecret(req, res, next) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return res.status(503).json({ message: 'CRON_SECRET not configured' });
  }
  const provided = req.header('x-cron-secret') || req.query.secret;
  if (provided !== expected) {
    return res.status(401).json({ message: 'Invalid cron secret' });
  }
  next();
}

// Single endpoint that does everything an external scheduler needs to do:
// 1. Update past-due doses to late/missed
// 2. Send reminder emails for upcoming doses
router.get('/tick', requireCronSecret, async (req, res) => {
  try {
    const statuses = await updateDoseStatuses();
    const reminders = await checkAndSendReminders();
    res.json({ ok: true, statuses, reminders });
  } catch (err) {
    console.error('Cron tick error:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Aliases for clarity
router.get('/check-reminders', requireCronSecret, async (req, res) => {
  try {
    const reminders = await checkAndSendReminders();
    res.json({ ok: true, reminders });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get('/update-statuses', requireCronSecret, async (req, res) => {
  try {
    const statuses = await updateDoseStatuses();
    res.json({ ok: true, statuses });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Verify email config by sending a one-off test email.
// Usage: GET /api/cron/test-email?secret=...&to=you@example.com
router.get('/test-email', requireCronSecret, async (req, res) => {
  const to = req.query.to || process.env.EMAIL_USER;
  if (!to) {
    return res.status(400).json({ ok: false, message: 'No recipient. Pass ?to=email or set EMAIL_USER.' });
  }
  const provider = process.env.RESEND_API_KEY
    ? 'resend'
    : (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD)
      ? 'gmail'
      : null;
  if (!provider) {
    return res.status(503).json({
      ok: false,
      message: 'No email provider configured. Set RESEND_API_KEY or EMAIL_USER + EMAIL_APP_PASSWORD.',
    });
  }
  try {
    const ok = await sendEmail({
      to,
      subject: 'MedTrack — test email',
      text: `If you got this, your ${provider} email config is working. ✓`,
      html: `<p>If you got this, your <strong>${provider}</strong> email config is working. ✓</p>`,
    });
    res.json({ ok: !!ok, to, provider });
  } catch (err) {
    res.status(500).json({ ok: false, provider, message: err.message });
  }
});

module.exports = router;
