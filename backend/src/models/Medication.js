const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  dose: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    timesPerDay: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    times: [{
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format (HH:MM)`
      }
    }]
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['Me', 'Mom', 'Dad', 'Other'],
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
medicationSchema.index({ user: 1, startDate: 1, endDate: 1 });

// Validate that times array length matches timesPerDay
medicationSchema.pre('save', function(next) {
  if (this.frequency.times.length !== this.frequency.timesPerDay) {
    next(new Error('Number of times must match timesPerDay'));
  }
  next();
});

// Validate that endDate is after startDate
medicationSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

const Medication = mongoose.model('Medication', medicationSchema);

module.exports = Medication; 