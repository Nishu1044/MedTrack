const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Dose = require('../models/Dose');
const Medication = require('../models/Medication');
const { dayRangeInZone, lastNDaysRangeInZone, localDateLabel } = require('../utils/timezone');

// Middleware to validate request
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get upcoming doses
router.get('/upcoming', auth, async (req, res) => {
  try {
    const now = new Date();
    const doses = await Dose.find({
      user: req.user._id,
      scheduledTime: { $gte: now },
      status: 'scheduled'
    })
    .populate('medication')
    .sort({ scheduledTime: 1 })
    .limit(10);

    res.json(doses);
  } catch (error) {
    console.error('Get upcoming doses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's doses (in the user's timezone)
router.get('/today', auth, async (req, res) => {
  try {
    const { start, end } = dayRangeInZone(req.user.timezone);

    const doses = await Dose.find({
      user: req.user._id,
      scheduledTime: { $gte: start, $lte: end },
    })
      .populate('medication')
      .sort({ scheduledTime: 1 });

    res.json(doses.filter((d) => d.medication));
  } catch (error) {
    console.error("Get today's doses error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark dose as taken
router.post('/:id/take', [
  auth,
  body('notes').optional().trim(),
  validateRequest
], async (req, res) => {
  try {
    const dose = await Dose.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!dose) {
      return res.status(404).json({ message: 'Dose not found' });
    }

    // Check if dose is too late (more than 4 hours)
    const now = new Date();
    const hoursLate = (now - dose.scheduledTime) / (1000 * 60 * 60);
    
    if (hoursLate > 4) {
      return res.status(400).json({ 
        message: 'Dose is too late (more than 4 hours)',
        hoursLate
      });
    }

    dose.takenTime = now;
    dose.status = hoursLate > 0 ? 'late' : 'taken';
    if (req.body.notes) {
      dose.notes = req.body.notes;
    }

    await dose.save();

    res.json(dose);
  } catch (error) {
    console.error('Mark dose as taken error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get adherence statistics (today, in the user's timezone)
router.get('/stats', auth, async (req, res) => {
  try {
    const { start, end } = dayRangeInZone(req.user.timezone);

    const doses = await Dose.find({
      user: req.user._id,
      scheduledTime: { $gte: start, $lte: end }
    }).populate({
      path: 'medication',
      select: 'name _id'
    });

    // Filter out any doses with null medication
    const validDoses = doses.filter(dose => dose.medication);

    // Calculate statistics
    const totalDoses = validDoses.length;
    const takenDoses = validDoses.filter(dose => dose.status === 'taken' || dose.status === 'late').length;
    const missedDoses = validDoses.filter(dose => dose.status === 'missed').length;
    const lateDoses = validDoses.filter(dose => dose.status === 'late').length;

    // Calculate adherence rate based on taken vs total doses
    const adherenceRate = totalDoses > 0 
      ? Math.round((takenDoses / totalDoses) * 100)
      : 0;

    // Get medication-specific stats
    const medicationStats = {};
    const medications = [...new Set(validDoses.map(dose => dose.medication._id))];

    for (const medicationId of medications) {
      const medicationDoses = validDoses.filter(dose => 
        dose.medication && dose.medication._id.equals(medicationId)
      );
      
      const medTotalDoses = medicationDoses.length;
      const medTakenDoses = medicationDoses.filter(dose => dose.status === 'taken' || dose.status === 'late').length;
      const medAdherenceRate = medTotalDoses > 0 
        ? Math.round((medTakenDoses / medTotalDoses) * 100)
        : 0;

      // Get medication name safely
      const medicationName = medicationDoses[0]?.medication?.name || 'Unknown Medication';

      medicationStats[medicationId] = {
        name: medicationName,
        totalDoses: medTotalDoses,
        takenDoses: medTakenDoses,
        adherenceRate: medAdherenceRate
      };
    }

    res.json({
      adherenceRate,
      totalDoses,
      takenDoses,
      missedDoses,
      lateDoses,
      medicationStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      message: 'Error calculating statistics',
      error: error.message 
    });
  }
});

// Get medication-specific adherence
router.get('/medication/:medicationId/stats', auth, async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.medicationId,
      user: req.user._id
    });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    const { start, end } = lastNDaysRangeInZone(req.user.timezone, 30);

    const doses = await Dose.find({
      user: req.user._id,
      medication: medication._id,
      scheduledTime: { $gte: start, $lte: end }
    });

    // Calculate statistics (count both 'taken' and 'late' as taken)
    const totalDoses = doses.length;
    const takenDoses = doses.filter(dose => dose.status === 'taken' || dose.status === 'late').length;
    const missedDoses = doses.filter(dose => dose.status === 'missed').length;
    const lateDoses = doses.filter(dose => dose.status === 'late').length;

    // Calculate adherence rate based on taken vs total doses
    const adherenceRate = totalDoses > 0 
      ? Math.round((takenDoses / totalDoses) * 100)
      : 0;

    res.json({
      medication: medication.name,
      totalDoses,
      takenDoses,
      missedDoses,
      lateDoses,
      adherenceRate
    });
  } catch (error) {
    console.error('Get medication stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calendar heatmap data (last 30 days bucketed by the user's local calendar date)
router.get('/calendar', auth, async (req, res) => {
  try {
    const tz = req.user.timezone || 'UTC';
    const { start, end } = lastNDaysRangeInZone(tz, 30);

    const doses = await Dose.find({
      user: req.user._id,
      scheduledTime: { $gte: start, $lte: end },
    });

    const dayMap = {};
    // Seed every day in the range
    for (let i = 0; i < 30; i++) {
      const { start: dayStart } = dayRangeInZone(tz, -(29 - i));
      const label = localDateLabel(dayStart, tz);
      dayMap[label] = { date: label, missed: 0, taken: 0, total: 0 };
    }
    doses.forEach((dose) => {
      const label = localDateLabel(dose.scheduledTime, tz);
      if (dayMap[label]) {
        dayMap[label].total++;
        if (dose.status === 'missed') dayMap[label].missed++;
        if (dose.status === 'taken' || dose.status === 'late') dayMap[label].taken++;
      }
    });

    res.json(Object.values(dayMap));
  } catch (error) {
    console.error('Calendar heatmap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 