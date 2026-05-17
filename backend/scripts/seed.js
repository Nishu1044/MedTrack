/**
 * Quick seed script — adds sample medications + doses for testing.
 *
 * Usage:
 *   node backend/scripts/seed.js              # uses the first user in the DB
 *   node backend/scripts/seed.js user@x.com   # uses a specific user
 *
 * Safe to re-run: it deletes existing meds/doses for the target user first.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Medication = require('../models/Medication');
const Dose = require('../models/Dose');

function pad(n) { return String(n).padStart(2, '0'); }
function hhmm(date) { return `${pad(date.getHours())}:${pad(date.getMinutes())}`; }
function todayLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}
function minutesFromNow(mins) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + mins);
  d.setSeconds(0, 0);
  return d;
}

async function run() {
  const targetEmail = process.argv[2];

  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const user = targetEmail
    ? await User.findOne({ email: targetEmail })
    : await User.findOne().sort({ createdAt: 1 });

  if (!user) {
    console.error('No user found. Sign up first via the app.');
    process.exit(1);
  }

  console.log(`Seeding for user: ${user.email} (tz: ${user.timezone || 'UTC'})`);

  // Clean existing meds/doses for this user
  await Dose.deleteMany({ user: user._id });
  await Medication.deleteMany({ user: user._id });
  console.log('Cleared existing meds and doses');

  const now = new Date();
  const reminderTest = minutesFromNow(8); // ~8 min from now, for testing reminders

  // 1) Paracetamol — daily morning + evening, runs 14 days
  const paracetamol = await Medication.create({
    user: user._id,
    name: 'Paracetamol',
    dose: '500mg',
    frequency: { timesPerDay: 2, times: ['08:00', '20:00'] },
    startDate: todayLocal(),
    endDate: daysFromNow(14),
    category: 'Me',
    notes: 'After meals',
  });

  // 2) Vitamin D — once a day, runs 30 days
  const vitamin = await Medication.create({
    user: user._id,
    name: 'Vitamin D3',
    dose: '60,000 IU',
    frequency: { timesPerDay: 1, times: ['09:00'] },
    startDate: todayLocal(),
    endDate: daysFromNow(30),
    category: 'Me',
    notes: 'Take with breakfast',
  });

  // 3) Reminder test med — single dose ~8 minutes from now (for testing email reminder)
  const reminderMed = await Medication.create({
    user: user._id,
    name: 'Test Reminder',
    dose: '1 tablet',
    frequency: { timesPerDay: 1, times: [hhmm(reminderTest)] },
    startDate: todayLocal(),
    endDate: todayLocal(),
    category: 'Me',
    notes: 'Soon-to-fire dose for reminder testing',
  });

  // 4) Mom's BP med — twice daily, started 3 days ago (will have history)
  const bpMed = await Medication.create({
    user: user._id,
    name: 'Amlodipine',
    dose: '5mg',
    frequency: { timesPerDay: 2, times: ['07:00', '19:00'] },
    startDate: daysFromNow(-3),
    endDate: daysFromNow(30),
    category: 'Mom',
    notes: 'BP medication',
  });

  console.log('Created 4 medications');

  // Now create doses
  const doses = [];

  // Helper: generate scheduled times for a medication between start and end date
  function generateDoses(med, statusForPast = 'taken') {
    const start = new Date(med.startDate);
    const end = new Date(med.endDate);
    end.setHours(23, 59, 59, 999);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      for (const time of med.frequency.times) {
        const [h, m] = time.split(':');
        const scheduled = new Date(d);
        scheduled.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

        let status = 'scheduled';
        let takenTime;

        if (scheduled < now) {
          // Past dose: mostly taken, some late, occasional missed
          const r = Math.random();
          if (r < 0.75) {
            status = 'taken';
            takenTime = new Date(scheduled.getTime() + Math.random() * 30 * 60 * 1000);
          } else if (r < 0.9) {
            status = 'late';
            takenTime = new Date(scheduled.getTime() + (60 + Math.random() * 120) * 60 * 1000);
          } else {
            status = 'missed';
          }
        }

        doses.push({
          user: user._id,
          medication: med._id,
          scheduledTime: scheduled,
          status,
          takenTime,
        });
      }
    }
  }

  generateDoses(paracetamol);
  generateDoses(vitamin);
  generateDoses(reminderMed);
  generateDoses(bpMed);

  await Dose.insertMany(doses);
  console.log(`Created ${doses.length} doses`);

  // Summary
  const counts = {
    scheduled: doses.filter(d => d.status === 'scheduled').length,
    taken: doses.filter(d => d.status === 'taken').length,
    late: doses.filter(d => d.status === 'late').length,
    missed: doses.filter(d => d.status === 'missed').length,
  };
  console.log('Status breakdown:', counts);
  console.log(`\nReminder test: "Test Reminder" scheduled at ${hhmm(reminderTest)} (~8 min from now)`);
  console.log('If cron-job.org or local cron is hitting /api/cron/tick with the right secret, you\'ll get an email.');

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
