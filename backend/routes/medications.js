const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Medication = require('../models/Medication');
const Dose = require('../models/Dose');
const { buildScheduledTime } = require('../utils/timezone');

// Middleware to validate request
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get all medications for user
router.get('/', auth, async (req, res) => {
  try {
    const medications = await Medication.find({ user: req.user._id, active: true });
    res.json(medications);
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single medication by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user._id,
      active: true
    });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    res.json(medication);
  } catch (error) {
    console.error('Get medication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new medication
router.post('/', [
  auth,
  body('name').trim().notEmpty(),
  body('dose').trim().notEmpty(),
  body('frequency.timesPerDay').isInt({ min: 1 }),
  body('frequency.times').isArray(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('category').isIn(['Me', 'Mom', 'Dad', 'Other']),
  validateRequest
], async (req, res) => {
  try {
    const {
      name,
      dose,
      frequency,
      startDate,
      endDate,
      category,
      notes
    } = req.body;

    // Create medication
    const medication = new Medication({
      user: req.user._id,
      name,
      dose,
      frequency,
      startDate,
      endDate,
      category,
      notes
    });

    await medication.save();

    const zone = req.user.timezone || 'UTC';
    const doses = [];
    const now = new Date();
    const endDateUTC = new Date(endDate);

    // Iterate days from startDate to endDate (inclusive). Each iteration represents
    // one calendar day in the user's timezone.
    let cursor = new Date(startDate);
    while (cursor <= endDateUTC) {
      for (const time of frequency.times) {
        const scheduledTime = buildScheduledTime(cursor, time, zone);
        if (scheduledTime >= now) {
          doses.push({
            user: req.user._id,
            medication: medication._id,
            scheduledTime,
            status: 'scheduled',
          });
        }
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    if (doses.length > 0) await Dose.insertMany(doses);

    res.status(201).json(medication);
  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update medication
router.put('/:id', [
  auth,
  body('name').optional().trim().notEmpty(),
  body('dose').optional().trim().notEmpty(),
  body('frequency.timesPerDay').optional().isInt({ min: 1 }),
  body('frequency.times').optional().isArray(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('category').optional().isIn(['Me', 'Mom', 'Dad', 'Other']),
  validateRequest
], async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Check if times are being updated
    const isTimeUpdated = req.body.frequency?.times && 
      JSON.stringify(req.body.frequency.times) !== JSON.stringify(medication.frequency.times);

    // Update medication fields
    Object.assign(medication, req.body);
    await medication.save();

    if (isTimeUpdated) {
      const zone = req.user.timezone || 'UTC';
      const now = new Date();
      const endDateUTC = new Date(medication.endDate);

      await Dose.deleteMany({
        medication: medication._id,
        user: req.user._id,
        scheduledTime: { $gte: now },
        status: 'scheduled',
      });

      const doses = [];
      let cursor = new Date(now);
      while (cursor <= endDateUTC) {
        for (const time of medication.frequency.times) {
          const scheduledTime = buildScheduledTime(cursor, time, zone);
          if (scheduledTime >= now) {
            doses.push({
              user: req.user._id,
              medication: medication._id,
              scheduledTime,
              status: 'scheduled',
            });
          }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      if (doses.length > 0) await Dose.insertMany(doses);
    }

    res.json(medication);
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete medication (hard delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Delete all associated doses first
    await Dose.deleteMany({
      medication: medication._id,
      user: req.user._id
    });

    // Then delete the medication completely
    await Medication.deleteOne({
      _id: req.params.id,
      user: req.user._id
    });

    res.json({ message: 'Medication and associated doses deleted' });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 