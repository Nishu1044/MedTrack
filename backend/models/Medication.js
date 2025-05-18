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
      min: 1
    },
    times: [{
      type: String,
      required: true
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
    required: true,
    enum: ['Me', 'Mom', 'Dad', 'Other'],
    default: 'Me'
  },
  notes: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
medicationSchema.index({ user: 1, active: 1 });

module.exports = mongoose.model('Medication', medicationSchema); 