const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const Dose = require('../models/Dose');

// =============================================================
// Dual-provider email support:
//   - Gmail SMTP (set EMAIL_USER + EMAIL_APP_PASSWORD)  ← primary
//   - Resend     (set RESEND_API_KEY)                    ← fallback / future
// If both are set, Resend wins.
// =============================================================

const REMINDER_WINDOW_MINUTES = 15;

// --- Gmail SMTP (nodemailer) ----------------------------------
let gmailTransporter = null;
function getGmailTransporter() {
  if (gmailTransporter) return gmailTransporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return null;
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
  return gmailTransporter;
}

async function sendViaGmail({ to, subject, text, html }) {
  const tx = getGmailTransporter();
  if (!tx) return false;
  await tx.sendMail({
    from: process.env.EMAIL_FROM || `MedTrack <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
  return true;
}

// --- Resend (kept for future / alternate provider) ------------
let resendClient = null;
function getResend() {
  if (resendClient) return resendClient;
  if (!process.env.RESEND_API_KEY) return null;
  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

async function sendViaResend({ to, subject, text, html }) {
  const client = getResend();
  if (!client) return false;
  const from = process.env.RESEND_FROM_EMAIL || 'MedTrack <onboarding@resend.dev>';
  const { error } = await client.emails.send({ from, to, subject, text, html });
  if (error) throw new Error(error.message || JSON.stringify(error));
  return true;
}

// Unified sender — picks the best available provider
async function sendEmail({ to, subject, text, html }) {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend({ to, subject, text, html });
  }
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    return sendViaGmail({ to, subject, text, html });
  }
  console.warn('No email provider configured — skipping send');
  return false;
}

// --- Email templates ------------------------------------------
function buildReminderEmail(user, medication, scheduledTime) {
  const time = scheduledTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const dosage = medication.dosage ? ` (${medication.dosage})` : '';
  return {
    subject: `MedTrack reminder: ${medication.name} at ${time}`,
    text: `Hi ${user.name},

This is a reminder to take your ${medication.name}${dosage} at ${time}.

— MedTrack`,
    html: `<p>Hi ${user.name},</p>
<p>This is a reminder to take <strong>${medication.name}${dosage}</strong> at <strong>${time}</strong>.</p>
<p>— MedTrack</p>`,
  };
}

async function sendReminderEmail(dose) {
  const { user, medication, scheduledTime } = dose;
  const { subject, text, html } = buildReminderEmail(user, medication, scheduledTime);
  return sendEmail({ to: user.email, subject, text, html });
}

// --- Cron-driven dose checks ----------------------------------
async function checkAndSendReminders() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60_000);

  const doses = await Dose.find({
    status: 'scheduled',
    scheduledTime: { $gte: now, $lte: windowEnd },
    reminderSentAt: null,
  })
    .populate('medication')
    .populate('user');

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const dose of doses) {
    if (!dose.user || !dose.user.email || !dose.medication) continue;
    if (dose.user.notificationsEnabled === false) {
      skipped++;
      continue;
    }
    try {
      const ok = await sendReminderEmail(dose);
      if (ok) {
        dose.reminderSentAt = new Date();
        await dose.save();
        sent++;
      }
    } catch (err) {
      failed++;
      console.error(`Failed to send reminder for dose ${dose._id}:`, err.message);
    }
  }

  return { checked: doses.length, sent, skipped, failed };
}

async function updateDoseStatuses() {
  const now = new Date();
  const doses = await Dose.find({
    status: 'scheduled',
    scheduledTime: { $lt: now },
  });

  let updated = 0;
  for (const dose of doses) {
    const minutesLate = Math.floor((now - dose.scheduledTime) / 60_000);
    dose.status = minutesLate > 30 ? 'missed' : 'late';
    await dose.save();
    updated++;
  }
  return { updated };
}

async function scheduleMedicationDoses(medication) {
  const doses = [];
  const currentDate = new Date(medication.startDate);
  const endDateTime = new Date(medication.endDate);
  const startDate = new Date(medication.startDate);

  while (currentDate <= endDateTime) {
    for (const time of medication.frequency.times) {
      const [hours, minutes] = time.split(':');
      const scheduledTime = new Date(currentDate);
      scheduledTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      if (scheduledTime >= startDate && scheduledTime <= endDateTime) {
        doses.push({
          user: medication.user,
          medication: medication._id,
          scheduledTime,
          status: 'scheduled',
        });
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (doses.length) await Dose.insertMany(doses);
  return doses.length;
}

module.exports = {
  checkAndSendReminders,
  updateDoseStatuses,
  scheduleMedicationDoses,
  sendReminderEmail,
  sendEmail,
};
