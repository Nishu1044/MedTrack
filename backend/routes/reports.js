const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');
const Dose = require('../models/Dose');
const Medication = require('../models/Medication');

// Generate PDF report
router.get('/pdf', auth, async (req, res) => {
  try {
    // Fetch all doses for the user
    const doses = await Dose.find({ user: req.user._id }).populate('medication');

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=medtrack-report.pdf');
    doc.pipe(res);

    // Title
    doc.fontSize(20).text('📄 MedTrack Report', { align: 'center' });
    doc.moveDown();

    if (!doses.length) {
      doc.fontSize(14).text('No medications were found in your account. Nothing to report at this time.', { align: 'center' });
    } else {
      doc.fontSize(14).text('Medication Logs:', { underline: true });
      doc.moveDown();
      doses.forEach(dose => {
        doc.fontSize(12).text(
          `Medication: ${dose.medication?.name || 'N/A'} | Dose: ${dose.medication?.dose || 'N/A'} | Time: ${dose.scheduledTime ? new Date(dose.scheduledTime).toLocaleString() : 'N/A'} | Status: ${dose.status ? dose.status.toUpperCase() : 'N/A'}`
        );
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (error) {
    console.error('PDF report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate CSV report
router.get('/csv', auth, async (req, res) => {
  try {
    // Fetch all doses for the user
    const doses = await Dose.find({ user: req.user._id }).populate('medication');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=medtrack-report.csv');

    // Write headers
    const headers = ['Medication Name', 'Dose', 'Time', 'Taken', 'Status'];
    let csvContent = headers.join(',') + '\n';

    if (!doses.length) {
      csvContent += 'No data available\n';
    } else {
      doses.forEach(dose => {
        csvContent += [
          dose.medication?.name || 'N/A',
          dose.medication?.dose || 'N/A',
          dose.scheduledTime ? new Date(dose.scheduledTime).toLocaleString() : 'N/A',
          dose.takenTime ? new Date(dose.takenTime).toLocaleString() : '',
          dose.status || 'N/A'
        ].join(',') + '\n';
      });
    }

    res.send(csvContent);
  } catch (error) {
    console.error('CSV report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 