const express = require('express');
const { formatInTimeZone } = require('date-fns-tz');
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');
const Dose = require('../models/Dose');

const router = express.Router();

function parseDateRange(query) {
  const filter = {};
  if (query.startDate) {
    const start = new Date(query.startDate);
    if (!isNaN(start)) {
      start.setUTCHours(0, 0, 0, 0);
      filter.$gte = start;
    }
  }
  if (query.endDate) {
    const end = new Date(query.endDate);
    if (!isNaN(end)) {
      end.setUTCHours(23, 59, 59, 999);
      filter.$lte = end;
    }
  }
  return filter;
}

function formatLocal(date, tz) {
  if (!date) return '';
  try {
    return formatInTimeZone(new Date(date), tz || 'UTC', 'yyyy-MM-dd HH:mm');
  } catch {
    return new Date(date).toISOString();
  }
}

// Escape a field for CSV: wrap in quotes if needed, double internal quotes.
function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function getDosesForReport(userId, query) {
  const dateFilter = parseDateRange(query);
  const find = { user: userId };
  if (Object.keys(dateFilter).length) find.scheduledTime = dateFilter;
  return Dose.find(find).populate('medication').sort({ scheduledTime: 1 });
}

router.get('/pdf', auth, async (req, res) => {
  try {
    const tz = req.user.timezone || 'UTC';
    const doses = await getDosesForReport(req.user._id, req.query);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=medtrack-report.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('MedTrack Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('gray').text(`Generated for ${req.user.email} (${tz})`, { align: 'center' });
    if (req.query.startDate || req.query.endDate) {
      doc.text(`Range: ${req.query.startDate || 'start'} → ${req.query.endDate || 'end'}`, { align: 'center' });
    }
    doc.fillColor('black').moveDown();

    if (!doses.length) {
      doc.fontSize(14).text('No medication doses found in this range.', { align: 'center' });
    } else {
      doc.fontSize(14).text('Medication Logs:', { underline: true });
      doc.moveDown();
      doses.forEach((dose) => {
        const name = dose.medication?.name || 'N/A';
        const dosage = dose.medication?.dose || 'N/A';
        const scheduled = formatLocal(dose.scheduledTime, tz);
        const taken = dose.takenTime ? formatLocal(dose.takenTime, tz) : '—';
        const status = (dose.status || 'n/a').toUpperCase();
        doc
          .fontSize(11)
          .text(`${name} (${dosage})`, { continued: false })
          .fontSize(9)
          .fillColor('gray')
          .text(`Scheduled: ${scheduled}  •  Taken: ${taken}  •  Status: ${status}`)
          .fillColor('black')
          .moveDown(0.4);
      });
    }

    doc.end();
  } catch (error) {
    console.error('PDF report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/csv', auth, async (req, res) => {
  try {
    const tz = req.user.timezone || 'UTC';
    const doses = await getDosesForReport(req.user._id, req.query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=medtrack-report.csv');

    const rows = [['Medication', 'Dose', 'Scheduled', 'Taken', 'Status', 'Notes']];
    doses.forEach((dose) => {
      rows.push([
        dose.medication?.name || '',
        dose.medication?.dose || '',
        formatLocal(dose.scheduledTime, tz),
        formatLocal(dose.takenTime, tz),
        dose.status || '',
        dose.notes || '',
      ]);
    });

    const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
    res.send(csv);
  } catch (error) {
    console.error('CSV report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
