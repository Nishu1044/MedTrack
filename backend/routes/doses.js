const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Dose = require('../models/Dose');
const Medication = require('../models/Medication');

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

// Get today's doses
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    // Set to start of day in UTC
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    console.log('Fetching doses between:', today.toISOString(), 'and', tomorrow.toISOString());

    const doses = await Dose.find({
      user: req.user._id,
      scheduledTime: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('medication')
    .sort({ scheduledTime: 1 });

    // Filter out doses with missing medication
    const validDoses = doses.filter(dose => dose.medication);
    console.log('Found doses:', validDoses.length);

    res.json(validDoses);
  } catch (error) {
    console.error('Get today\'s doses error:', error);
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

    // Check if dose is too late (more than 1 minute for testing)
    const now = new Date();
    const minutesLate = (now - dose.scheduledTime) / (1000 * 60);
    if (minutesLate > 1) {
      return res.status(400).json({ 
        message: 'Dose is too late (more than 1 minute)',
        minutesLate
      });
    }

    dose.takenTime = now;
    dose.status = minutesLate > 0 ? 'late' : 'taken';
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

// Get adherence statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Get all doses for the user scheduled for today
    const doses = await Dose.find({
      user: req.user._id,
      scheduledTime: { $gte: today, $lte: endOfToday }
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

    // Calculate date range: last 30 days including all of today
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date(endOfToday);
    thirtyDaysAgo.setDate(endOfToday.getDate() - 29); // 30 days including today

    // Get all doses for this medication in the last 30 days (including all of today)
    const doses = await Dose.find({
      user: req.user._id,
      medication: medication._id,
      scheduledTime: { $gte: thirtyDaysAgo, $lte: endOfToday }
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

// Calendar heatmap data endpoint
router.get('/calendar', auth, async (req, res) => {
  try {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get all doses for the user in the current month
    const doses = await Dose.find({
      user: req.user._id,
      scheduledTime: { $gte: monthStart, $lte: monthEnd }
    });

    // Group doses by date
    const dayMap = {};
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dayMap[dateStr] = { date: dateStr, missed: 0, taken: 0, total: 0 };
    }
    doses.forEach(dose => {
      const dateStr = new Date(dose.scheduledTime).toISOString().split('T')[0];
      if (dayMap[dateStr]) {
        dayMap[dateStr].total++;
        if (dose.status === 'missed') dayMap[dateStr].missed++;
        if (dose.status === 'taken' || dose.status === 'late') dayMap[dateStr].taken++;
      }
    });
    const result = Object.values(dayMap);
    res.json(result);
  } catch (error) {
    console.error('Calendar heatmap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 