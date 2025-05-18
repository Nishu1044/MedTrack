const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Medication = require('../models/Medication');
const Dose = require('../models/Dose');

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

    // Create initial doses
    const doses = [];
    const currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);
    const now = new Date();

    // Set time to start of day for date comparison in LOCAL time
    currentDate.setHours(0, 0, 0, 0);
    endDateTime.setHours(23, 59, 59, 999);

    console.log('Creating doses from:', currentDate.toISOString(), 'to', endDateTime.toISOString());
    console.log('Times per day:', frequency.times);

    while (currentDate <= endDateTime) {
      for (const time of frequency.times) {
        const [hours, minutes] = time.split(':');
        const scheduledTime = new Date(currentDate);
        // Set hours and minutes in LOCAL time
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Only create doses for the current day and future
        if (scheduledTime >= now) {
          doses.push({
            user: req.user._id,
            medication: medication._id,
            scheduledTime,
            status: 'scheduled'
          });
          console.log(`Created dose for ${name} at ${scheduledTime.toISOString()}`);
        }
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (doses.length > 0) {
      await Dose.insertMany(doses);
      console.log(`Created ${doses.length} doses for medication ${name}`);
    } else {
      console.log('No doses were created - check if dates are in the future');
    }

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

    // If times are updated, update future doses
    if (isTimeUpdated) {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDateTime = new Date(medication.endDate);
      endDateTime.setHours(23, 59, 59, 999);

      // Delete future scheduled doses
      await Dose.deleteMany({
        medication: medication._id,
        user: req.user._id,
        scheduledTime: { $gte: now },
        status: 'scheduled'
      });

      // Create new doses with updated times
      const doses = [];
      const currentDate = new Date(today); // Start from today

      while (currentDate <= endDateTime) {
        for (const time of medication.frequency.times) {
          const [hours, minutes] = time.split(':');
          const scheduledTime = new Date(currentDate);
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Only skip doses for days before today
          if (scheduledTime >= today) {
            doses.push({
              user: req.user._id,
              medication: medication._id,
              scheduledTime,
              status: 'scheduled'
            });
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (doses.length > 0) {
        await Dose.insertMany(doses);
        console.log(`Updated ${doses.length} future doses for medication ${medication.name}`);
      }
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

    console.log(`Completely deleted medication ${medication.name} and all associated doses from database`);

    res.json({ message: 'Medication and associated doses completely deleted from database' });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 